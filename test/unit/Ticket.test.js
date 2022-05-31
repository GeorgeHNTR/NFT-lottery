const { expect } = require("chai");
const { ethers } = require("hardhat");

let { NAME, SYMBOL, PRICE, getBlocks } = require("../utils/ticket");
let { mineBlocks } = require("../utils/helpers.js");

describe.only('Ticket', async function () {
    beforeEach(async function () {
        [deployer, player2, player3] = await ethers.getSigners();
        this.Ticket = await (await ethers.getContractFactory("Ticket")).deploy();

        this.BLOCKS = await getBlocks();
        this.WINNER_PICKER = "0x10c1288cc3d8bfb060e5b01de314b5c85802cb6e"; // random address
        this.PARAMS = [NAME, SYMBOL, this.BLOCKS.START_BLOCK, this.BLOCKS.END_BLOCK, PRICE, this.WINNER_PICKER];
    });

    describe("Upon initialization", async function () {
        describe('Setting properties', async function () {
            beforeEach(async function () {
                await this.Ticket.initialize(...this.PARAMS);
            });

            it('should set correct name', async function () {
                expect(await this.Ticket.name()).to.equal(NAME);
            });

            it('should set correct symbol', async function () {
                expect(await this.Ticket.symbol()).to.equal(SYMBOL);
            });

            it('should set correct start block', async function () {
                expect(await this.Ticket.START_BLOCK_NUMBER()).to.equal(this.BLOCKS.START_BLOCK);
            });

            it('should set correct end block', async function () {
                expect(await this.Ticket.END_BLOCK_NUMBER()).to.equal(this.BLOCKS.END_BLOCK);
            });

            it('should set correct price', async function () {
                expect(await this.Ticket.TICKET_PRICE()).to.equal(PRICE);
            });

            it('should set correct winner picker / vrf consumer', async function () {
                expect((await this.Ticket.WINNER_PICKER()).toLowerCase()).to.equal(this.WINNER_PICKER);
            });
        });

        describe('Input validation', async function () {
            afterEach(async function () {
                await expect(this.Ticket.initialize(...this.PARAMS)).to.be.revertedWith("InvalidInput()");
            });

            it('should throw if name is empty string', async function () {
                this.PARAMS[0] = "";
            });

            it('should throw if symbol is empty string', async function () {
                this.PARAMS[1] = "";
            });

            it('should throw if starting block less than current one', async function () {
                this.PARAMS[2] = this.BLOCKS.CURRENT_BLOCK - 1;
            });

            it('should throw if ending block less than or equal to the starting one', async function () {
                this.PARAMS[3] = this.BLOCKS.START_BLOCK - 1;
            });

            it('should throw if ticket is free', async function () {
                this.PARAMS[4] = 0;
            });
        });

        describe("Attack", async function () {
            it("should not be able to initialize a second time", async function () {
                await this.Ticket.initialize(...this.PARAMS);
                await expect(this.Ticket.initialize(...this.PARAMS))
                    .to.be.revertedWith("Initializable: contract is already initialized");
            });
        });
    });

    describe("Ticket purchasing", async function () {
        describe("Restrictions", async function () {
            it("should not be allowed before starting block", async function () {
                await this.Ticket.initialize(...this.PARAMS); // starting block is 5 blocks ahead
                await expect(this.Ticket.buyTicket({ value: PRICE })).to.be.revertedWith("Unavailable()");
                await expect(this.Ticket.buyTicketWithURI("uri", { value: PRICE })).to.be.revertedWith("Unavailable()");
            });

            it("should not be allowed after end block", async function () {
                const blocksUntilEnd = this.BLOCKS.END_BLOCK - this.BLOCKS.CURRENT_BLOCK;
                // ending block is *blocksUntilEnd* blocks ahead
                await this.Ticket.initialize(...this.PARAMS);
                await mineBlocks(blocksUntilEnd);
                await expect(this.Ticket.buyTicket({ value: PRICE })).to.be.revertedWith("Unavailable()");
                await expect(this.Ticket.buyTicketWithURI("uri", { value: PRICE })).to.be.revertedWith("Unavailable()");
            });

            it("should check if sending ether amount corresponding to the ticket price (normal)", async function () {
                this.PARAMS[2] = this.BLOCKS.CURRENT_BLOCK + 1;
                await this.Ticket.initialize(...this.PARAMS);
                await expect(this.Ticket.buyTicket({ value: 1 })).to.be.revertedWith("InvalidAmount()");
                await expect(this.Ticket.buyTicket({ value: PRICE })).to.not.be.revertedWith("InvalidAmount()");
            });

            it("should check if sending ether amount corresponding to the ticket price (uri)", async function () {
                this.PARAMS[2] = this.BLOCKS.CURRENT_BLOCK + 1;
                await this.Ticket.initialize(...this.PARAMS);
                await expect(this.Ticket.buyTicketWithURI("uri", { value: 1 })).to.be.revertedWith("InvalidAmount()");
                await expect(this.Ticket.buyTicketWithURI("uri", { value: PRICE })).to.not.be.revertedWith("InvalidAmount()");
            });
        });

        describe("Logic", async function () {
            beforeEach(async function () {
                this.PARAMS[2] = this.BLOCKS.CURRENT_BLOCK + 1;
                await this.Ticket.initialize(...this.PARAMS);
                this.id = (await this.Ticket.id()).toNumber();
            });

            it("should mint a new token to the user with the current id height (normal)", async function () {
                await this.Ticket.buyTicket({ value: PRICE });
                expect(await this.Ticket.ownerOf(this.id)).to.equal(deployer.address);
            });

            it("should mint a new token to the user with the current id height (uri)", async function () {
                await this.Ticket.buyTicketWithURI("uri", { value: PRICE });
                expect(await this.Ticket.ownerOf(this.id)).to.equal(deployer.address);
            });

            it("should set token uri (uri)", async function () {
                await this.Ticket.buyTicketWithURI("uri", { value: PRICE });
                expect(await this.Ticket.tokenURI(this.id)).to.equal("uri");
            });

            it("should increment id counter (normal)", async function () {
                await this.Ticket.buyTicket({ value: PRICE });
                expect((await this.Ticket.id()).toNumber()).to.be.greaterThan(this.id);
            });

            it("should increment id counter (uri)", async function () {
                await this.Ticket.buyTicketWithURI("uri", { value: PRICE });
                expect((await this.Ticket.id()).toNumber()).to.be.greaterThan(this.id);
            });
        });
    });

    describe("Picking winner", async function () {
        describe("The small winner", async function () {
            beforeEach(async function () {
                await this.Ticket.initialize(...this.PARAMS);
                this.blocksUntilMidtimeBlockNumber = this.BLOCKS.START_BLOCK - this.BLOCKS.CURRENT_BLOCK + (this.BLOCKS.END_BLOCK - this.BLOCKS.START_BLOCK) / 2 - 2;
            });

            it("should not be able to pick a winner before midtime", async function () {
                await mineBlocks(this.blocksUntilMidtimeBlockNumber - 1);
                await expect(this.Ticket.pickWinner()).to.be.revertedWith("Unavailable()");
            });

            it("should be able to pick a winner before end", async function () {
                await mineBlocks(this.blocksUntilMidtimeBlockNumber);
                await expect(this.Ticket.pickWinner()).to.not.be.revertedWith("Unavailable()");
            });
        });

        describe("The big winner", async function () {
            beforeEach(async function () {
                await this.Ticket.initialize(...this.PARAMS);
            });

            it("should be able to pick a winner after end", async function () {
                await mineBlocks(this.BLOCKS.END_BLOCK - this.BLOCKS.CURRENT_BLOCK);
                await expect(this.Ticket.pickWinner()).to.not.be.revertedWith("Unavailable()");
            });
        });

        it("should send LINK tokens to the vrf consumer contract", async function () {
            await mineBlocks(this.blocksUntilMidtimeBlockNumber);
            // on hre we expect an error
            await expect(this.Ticket.pickWinner()).to.be.revertedWith("Transaction reverted: function call to a non-contract account");
        });
    });

    describe("Getters", async function () {
        describe("Finished status checker", async function () {
            beforeEach(async function () {
                await this.Ticket.initialize(...this.PARAMS);
            });

            it("should return false if not finished yet", async function () {
                expect(await this.Ticket.finished()).to.be.false;
            });

            it("should return true if finished", async function () {
                await mineBlocks(this.BLOCKS.END_BLOCK - this.BLOCKS.CURRENT_BLOCK);
                expect(await this.Ticket.finished()).to.be.true;
            });
        });

        describe("Started status checker", async function () {
            beforeEach(async function () {
                await this.Ticket.initialize(...this.PARAMS);
            });

            it("should return false if not started yet", async function () {
                expect(await this.Ticket.started()).to.be.false;
            });

            it("should return true if started", async function () {
                await mineBlocks(this.BLOCKS.START_BLOCK - this.BLOCKS.CURRENT_BLOCK);
                expect(await this.Ticket.started()).to.be.true;
            });
        });
    });
});