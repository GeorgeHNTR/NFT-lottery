const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('TicketFactory', () => {
    let NAME = 'Ticket';
    let SYMBOL = 'TCKT';

    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();

        this.TicketImplementation = await (await ethers.getContractFactory('Ticket')).deploy();

        this.TicketBeacon = await (await ethers.getContractFactory('TicketBeacon')).deploy(this.TicketImplementation.address);
        this.TicketFactory = await (await ethers.getContractFactory('TicketFactory')).deploy(this.TicketBeacon.address);
    });

    describe("Proxy deployment", async function () {
        it('should save newly created proxy addresses', async function () {
            await this.TicketFactory.deployTicketProxy(NAME, SYMBOL);
            expect(await this.TicketFactory.deployedTicketProxies()).to.have.lengthOf(1);
        });
    });
});