const { expect } = require("chai");
const { ethers } = require("hardhat");

const { NAME, SYMBOL, START_TIME, END_TIME } = require("./utils/utils");

describe('TicketProxy', () => {
    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();

        this.TicketImplementation = await (await ethers.getContractFactory('Ticket')).deploy();

        this.TicketBeacon = await (await ethers.getContractFactory('TicketBeacon')).deploy(this.TicketImplementation.address);
        this.TicketFactory = await (await ethers.getContractFactory('TicketFactory')).deploy(this.TicketBeacon.address);
    });

    describe("Upon deployment", async function () {
        it('should save correct beacon address', async function () {
            await this.TicketFactory.deployTicketProxy(NAME, SYMBOL, START_TIME, END_TIME);
            const deployedTicketProxyAddress = (await this.TicketFactory.deployedTicketProxies())[0];
            const deployedTicketProxy = await ethers.getContractAt('TicketProxy', deployedTicketProxyAddress);
            expect(await deployedTicketProxy.beacon()).to.equal(this.TicketBeacon.address);
        });
    });
});