const { expect } = require("chai");
const { ethers } = require("hardhat");

const { NAME, SYMBOL, START_TIME, END_TIME } = require("./utils/utils");

describe('Ticket', () => {
    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();

        this.Ticket = await (
            await ethers.getContractFactory('Ticket')
        ).deploy();
    });

    describe("Upon initialization", async function () {
        describe("Setting properties", async function () {
            beforeEach(async function () {
                await this.Ticket.initialize(NAME, SYMBOL, START_TIME, END_TIME);
            });

            it('should set correct name', async function () {
                expect(await this.Ticket.name()).to.equal(NAME);
            });

            it('should set correct symbol', async function () {
                expect(await this.Ticket.symbol()).to.equal(SYMBOL);
            });

            it('should set correct start time', async function () {
                expect(await this.Ticket.start()).to.equal(START_TIME);
            });

            it('should set correct end time', async function () {
                expect(await this.Ticket.end()).to.equal(END_TIME);
            });

            it('should be paused', async function () {
                expect(await this.Ticket.paused()).to.be.true;
            });
        });

        describe("Throwing", async function () {
            it('should throw if attempt to initialize again', async function () {
                await this.Ticket.initialize(NAME, SYMBOL, START_TIME, END_TIME);
                await expect(this.Ticket.initialize("second-attempt", "second-attempt", START_TIME, END_TIME)).to.be.revertedWith("Initializable: contract is already initialized");
            });

            it('should throw if empty string passed as name', async function () {
                await expect(this.Ticket.initialize("", "second-attempt", START_TIME, END_TIME)).to.be.revertedWith("InvalidInput()");
            });

            it('should throw if empty string passed as symbol', async function () {
                await expect(this.Ticket.initialize("second-attempt", "", START_TIME, END_TIME)).to.be.revertedWith("InvalidInput()");
            });

            it('should throw if starting earlier than now', async function () {
                await expect(this.Ticket.initialize("second-attempt", "", START_TIME - 1, END_TIME)).to.be.revertedWith("InvalidInput()");
            });

            it('should throw if lasting less than 2 hours', async function () {
                await expect(this.Ticket.initialize("second-attempt", "", START_TIME, END_TIME - 1)).to.be.revertedWith("InvalidInput()");
            });
        });
    });

    describe("Buying/minting tickets", async function () {
        beforeEach(async function () {
            await this.Ticket.initialize(NAME, SYMBOL, 0, END_TIME);
            await this.Ticket.buyTicket({ value: await this.Ticket.TICKET_PRICE() });
        });

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

        it('should cost exactly 0.001 ETH', async function () {
            await expect(this.Ticket.buyTicket({ value: (await this.Ticket.TICKET_PRICE() - 1) })).to.be.revertedWith('InvalidAmount()');
            await expect(this.Ticket.buyTicket({ value: (await this.Ticket.TICKET_PRICE() + 1) })).to.be.revertedWith('InvalidAmount()');
        });
    });
});