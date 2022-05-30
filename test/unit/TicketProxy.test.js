const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('TicketProxy', async function () {
    beforeEach(async function () {
        [deployer] = await ethers.getSigners();
        this.TicketImplementationAddress = (await (await ethers.getContractFactory("Ticket")).deploy()).address;
        this.TicketBeaconAddress = (await (await ethers.getContractFactory("TicketBeacon"))
            .deploy(this.TicketImplementationAddress)).address;
        this.TicketProxy = await (await ethers.getContractFactory("TicketProxy"))
            .deploy(this.TicketBeaconAddress);
    });

    describe("Upon deployment", async function () {
        it('should save the implementation', async function () {
            expect(await this.TicketProxy.implementation()).to.equal(this.TicketImplementationAddress);
        });

        it('should save the beacon', async function () {
            expect(await this.TicketProxy.beacon()).to.equal(this.TicketBeaconAddress);
        });
    });
});