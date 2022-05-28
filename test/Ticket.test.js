const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('Ticket', () => {
    let NAME = 'Ticket';
    let SYMBOL = 'TCKT';

    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();

        this.Ticket = await (
            await ethers.getContractFactory('Ticket')
        ).deploy();
        this.Ticket.initialize(NAME, SYMBOL);
    });

    describe("Upon initialization", async function () {
        describe("Setting properties", async function () {
            it('should set correct name', async function () {
                expect(await this.Ticket.name()).to.equal(NAME);
            });

            it('should set correct symbol', async function () {
                expect(await this.Ticket.symbol()).to.equal(SYMBOL);
            });

            it('should not be paused', async function () {
                expect(await this.Ticket.paused()).to.be.false;
            });
        });

        describe("Throwing", async function () {
            it('should throw if attempt to initialize again', async function () {
                await expect(this.Ticket.initialize("second-attempt", "second-attempt")).to.be.revertedWith("Initializable: contract is already initialized");
            });

            it('should throw if empty string passed as name', async function () {
                await expect(this.Ticket.initialize("", "second-attempt")).to.be.reverted;
            });

            it('should throw if empty string passed as symbol', async function () {
                await expect(this.Ticket.initialize("second-attempt", "")).to.be.reverted;
            });
        });
    });
});