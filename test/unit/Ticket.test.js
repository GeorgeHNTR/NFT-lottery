const { expect } = require("chai");
const { ethers } = require("hardhat");

let { NAME, SYMBOL, PRICE, getBlocks } = require("../utils/ticket");
let { mineBlocks } = require("../utils/helpers");
const { deployMockedLink, deployMockedWinnerPicker } = require("../utils/mock");

describe('Ticket', async function () {
    beforeEach(async function () {
        [deployer, player2, player3] = await ethers.getSigners();
        this.Ticket = await (await ethers.getContractFactory("Ticket")).deploy();

        this.LINK_TOKEN_MOCK = await deployMockedLink();

        this.WINNER_PICKER_MOCK = await deployMockedWinnerPicker();

        await Promise.all([
            this.WINNER_PICKER_MOCK.mock.LINK_TOKEN.returns(this.LINK_TOKEN_MOCK.address),
            this.WINNER_PICKER_MOCK.mock.fee.returns(ethers.utils.parseEther("0.25")),
            this.WINNER_PICKER_MOCK.mock.getRandomNumber.returns("0x" + Array(65).join('0')),
            this.LINK_TOKEN_MOCK.mock.transferFrom.withArgs(deployer.address, this.WINNER_PICKER_MOCK.address, ethers.utils.parseEther("0.25")).returns(true)
        ]);

        this.BLOCKS = await getBlocks();
        this.PARAMS = [NAME, SYMBOL, this.BLOCKS.START_BLOCK, this.BLOCKS.END_BLOCK, PRICE, this.WINNER_PICKER_MOCK.address];
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
                expect(await this.Ticket.WINNER_PICKER()).to.equal(this.WINNER_PICKER_MOCK.address);
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
        beforeEach(async function () {
            await this.Ticket.initialize(...this.PARAMS);
            this.blocksUntilMidtimeBlockNumber = this.BLOCKS.START_BLOCK - this.BLOCKS.CURRENT_BLOCK + (this.BLOCKS.END_BLOCK - this.BLOCKS.START_BLOCK) / 2 - 2;
        });

        describe("Block validations", async function () {
            it("should not be able to pick the small winner before midtime", async function () {
                await mineBlocks(this.blocksUntilMidtimeBlockNumber - 1);
                await expect(this.Ticket.pickWinner()).to.be.revertedWith("Unavailable()");
            });

            it("should be able to pick the small winner before end", async function () {
                await mineBlocks(this.blocksUntilMidtimeBlockNumber);
                await expect(this.Ticket.pickWinner()).to.not.be.revertedWith("Unavailable()");
            });

            it("should be able to pick the big winner after end", async function () {
                await mineBlocks(this.BLOCKS.END_BLOCK - this.BLOCKS.CURRENT_BLOCK);
                await expect(this.Ticket.pickWinner()).to.not.be.revertedWith("Unavailable()");
            });
        });

        describe("VRFConsumer/WinnerPicker contract interaction", async function () {
            it("should transfer LINK tokens from the msg.sender balance to the VRFConsumer contract", async function () {
                await mineBlocks(this.blocksUntilMidtimeBlockNumber);

                await expect(this.Ticket.pickWinner()).to.not.be.revertedWith("TransactionFailed()");
            });

            it("should request a random number", async function () {
                // Think of a better way to check this one
                const signatureSmall = "saveSmallWinner(uint256)";
                const signatureBig = "saveBigWinner(uint256)";
                await this.WINNER_PICKER_MOCK.mock.getRandomNumber.withArgs(signatureSmall).revertsWithReason(signatureSmall);
                await this.WINNER_PICKER_MOCK.mock.getRandomNumber.withArgs(signatureBig).revertsWithReason(signatureBig);


                await mineBlocks(this.blocksUntilMidtimeBlockNumber);
                await expect(this.Ticket.pickWinner()).to.be.revertedWith(signatureSmall);

                await mineBlocks(this.blocksUntilMidtimeBlockNumber);
                await expect(this.Ticket.pickWinner()).to.be.revertedWith(signatureBig);
            });

            it("should save boolean that we have picked a winner", async function () {
                await mineBlocks(this.blocksUntilMidtimeBlockNumber);
                await this.Ticket.pickWinner();
                expect(await this.Ticket.pickedSmall()).to.be.true;

                await mineBlocks(this.blocksUntilMidtimeBlockNumber);
                await this.Ticket.pickWinner();
                expect(await this.Ticket.pickedBig()).to.be.true;
            });
        });
    });

    describe("Choosing winners", async function () {
        beforeEach(async function () {
            this.PARAMS[5] = deployer.address;
            await this.Ticket.initialize(...this.PARAMS);
            await mineBlocks(this.BLOCKS.START_BLOCK - this.BLOCKS.CURRENT_BLOCK);
            await this.Ticket.buyTicket({ value: PRICE }); // so we can choose a winner
            await this.Ticket.buyTicket({ value: PRICE }); // so we can choose a winner
            this.randomness = 3;
        });

        describe("Saving small winner", async function () {
            it("should save winning ticket id", async function () {
                await this.Ticket.saveSmallWinner(this.randomness);
                expect(await this.Ticket.smallWinnerTicketId()).to.equal(1); // 3 % 2 = 1
            });

            it("should save reward amount equal to half of current balance", async function () {
                await this.Ticket.saveSmallWinner(this.randomness);
                expect(await this.Ticket.smallWinnerRewardAmount()).to.equal(0.5 * Number(await ethers.provider.getBalance(this.Ticket.address)));
            });

            it("should emit an event", async function () {
                await expect(this.Ticket.saveSmallWinner(this.randomness)).to.emit(this.Ticket, "WinnerChoosen").withArgs(deployer.address, 1);
            });
        });

        describe("Saving big winner", async function () {
            beforeEach(async function () {
                await mineBlocks(this.BLOCKS.END_BLOCK - this.BLOCKS.START_BLOCK + 1000);
            });

            it("should save winning ticket id", async function () {
                await this.Ticket.saveBigWinner(this.randomness);
                expect(await this.Ticket.bigWinnerTicketId()).to.equal(1); // 3 % 2 = 1
            });

            it("should emit an event", async function () {
                await this.Ticket.saveBigWinner(this.randomness);
                await expect(this.Ticket.saveBigWinner(this.randomness)).to.emit(this.Ticket, "WinnerChoosen").withArgs(deployer.address, 1);
            });
        });
    });

    describe("Getters", async function () {
        beforeEach(async function () {
            await this.Ticket.initialize(...this.PARAMS);
        });

        describe("Finished status checker", async function () {
            it("should return false if not finished yet", async function () {
                expect(await this.Ticket.finished()).to.be.false;
            });

            it("should return true if finished", async function () {
                await mineBlocks(this.BLOCKS.END_BLOCK - this.BLOCKS.CURRENT_BLOCK);
                expect(await this.Ticket.finished()).to.be.true;
            });
        });

        describe("Started status checker", async function () {
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