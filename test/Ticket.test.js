const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('Ticket', () => {
    let NAME = 'Ticket';
    let SYMBOL = 'TCKT';

    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();

        this.Ticket = await (
            await ethers.getContractFactory('Ticket')
        ).deploy(NAME, SYMBOL);
    });

    describe("Upon deployment", async function () {
        it('should set correct name', async function () {
            expect(await this.Ticket.name()).to.equal(NAME);
        });

        it('should set correct symbol', async function () {
            expect(await this.Ticket.symbol()).to.equal(SYMBOL);
        });
    });
});