const { expect } = require("chai");
const { ethers } = require("hardhat");

let { NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE } = require("./utils/utils");

describe('TicketFactory', () => {

    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();

        this.TicketImplementation = await (await ethers.getContractFactory('Ticket')).deploy();

        this.TicketBeacon = await (await ethers.getContractFactory('TicketBeacon')).deploy(this.TicketImplementation.address);
        this.TicketFactory = await (await ethers.getContractFactory('TicketFactory')).deploy(this.TicketBeacon.address);

        CURRENT_BLOCK = Number(await network.provider.send('eth_blockNumber'));
        START_BLOCK = CURRENT_BLOCK + 5;
        END_BLOCK = START_BLOCK + 10;
    });

    describe("Proxy deployment", async function () {
        it('should save newly created proxy addresses', async function () {
            await this.TicketFactory.deployTicketProxy(NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE);
            expect(await this.TicketFactory.deployedTicketProxies()).to.have.lengthOf(1);
        });

        it('should revert if last ticket has not finished', async function () {
            await this.TicketFactory.deployTicketProxy(NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE);
            await expect(this.TicketFactory.deployTicketProxy(NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE)).to.be.revertedWith("OnlyOneTicketAtTime()");
        });
    });
});