const { expect } = require("chai");
const { ethers } = require("hardhat");

let { NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE } = require("./utils/utils");

describe('Ticket', () => {
    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();

        this.Ticket = await (
            await ethers.getContractFactory('Ticket')
        ).deploy();

        CURRENT_BLOCK = Number(await network.provider.send('eth_blockNumber'));
        START_BLOCK = CURRENT_BLOCK + 5;
        END_BLOCK = START_BLOCK + 10;
    });

    describe("Upon initialization", async function () {
        describe("Setting properties", async function () {
            beforeEach(async function () {
                await this.Ticket.initialize(NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE);
            });

            it('should set correct name', async function () {
                expect(await this.Ticket.name()).to.equal(NAME);
            });

            it('should set correct symbol', async function () {
                expect(await this.Ticket.symbol()).to.equal(SYMBOL);
            });

            it('should set correct start time', async function () {
                expect(await this.Ticket.START()).to.equal(START_BLOCK);
            });

            it('should set correct end time', async function () {
                expect(await this.Ticket.END()).to.equal(END_BLOCK);
            });

            it('should be paused', async function () {
                expect(await this.Ticket.paused()).to.be.true;
            });
        });

        describe("Throwing", async function () {
            it('should throw if attempt to initialize again', async function () {
                await this.Ticket.initialize(NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE);
                await expect(this.Ticket.initialize("second-attempt", "second-attempt", START_BLOCK, END_BLOCK, PRICE)).to.be.revertedWith("Initializable: contract is already initialized");
            });

            it('should throw if empty string passed as name', async function () {
                await expect(this.Ticket.initialize("", SYMBOL, START_BLOCK, END_BLOCK, PRICE)).to.be.revertedWith("InvalidInput()");
            });

            it('should throw if empty string passed as symbol', async function () {
                await expect(this.Ticket.initialize(NAME, "", START_BLOCK, END_BLOCK, PRICE)).to.be.revertedWith("InvalidInput()");
            });

            it('should throw if starting earlier than now', async function () {
                await expect(this.Ticket.initialize(NAME, SYMBOL, Number(await network.provider.send('eth_blockNumber')) - 1, END_BLOCK, PRICE)).to.be.revertedWith("InvalidInput()");
            });

            it('should throw if end block number less than start block number', async function () {
                await expect(this.Ticket.initialize(NAME, SYMBOL, END_BLOCK, START_BLOCK, PRICE)).to.be.revertedWith("InvalidInput()");
            });
        });
    });

    describe("Buying/minting tickets", async function () {
        beforeEach(async function () {
            await this.Ticket.initialize(NAME, SYMBOL, CURRENT_BLOCK + 1, END_BLOCK, PRICE);
            await this.Ticket.buyTicket({ value: await this.Ticket.TICKET_PRICE() });
        });
        describe("Default", async function () {
            it('should mint a new token to msg.sender', async function () {
                expect(await this.Ticket.balanceOf(deployer.address)).to.equal(1);
            });

            it('should save the token with correct id', async function () {
                expect(await this.Ticket.ownerOf(0)).to.equal(deployer.address);
            });

            it('should increment id', async function () {
                const currentId = Number(await this.Ticket.id());
                await this.Ticket.buyTicket({ value: await this.Ticket.TICKET_PRICE() });
                expect(await this.Ticket.id()).to.equal(currentId + 1);
            });

            it('should cost the price amount', async function () {
                await expect(this.Ticket.buyTicket({ value: (await this.Ticket.TICKET_PRICE() - 1) })).to.be.revertedWith('InvalidAmount()');
                await expect(this.Ticket.buyTicket({ value: (await this.Ticket.TICKET_PRICE() + 1) })).to.be.revertedWith('InvalidAmount()');
            });
        });

        describe("With token URI", async function () {
            it('should set token URI', async function () {
                const ticketID = Number(await this.Ticket.id());
                await this.Ticket.buyTicketWithURI("test-tokenURI", { value: await this.Ticket.TICKET_PRICE() });
                expect(await this.Ticket.tokenURI(ticketID)).to.equal("test-tokenURI");
            });
        });

    });
});