const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('TicketBeacon', async function () {
    beforeEach(async function () {
        [deployer] = await ethers.getSigners();
        this.TicketImplementationAddress = (await (await ethers.getContractFactory("Ticket")).deploy()).address;
        this.TicketBeacon = await (await ethers.getContractFactory("TicketBeacon"))
            .deploy(this.TicketImplementationAddress);
    });

    describe("Upon deployment", async function () {
        it('should set deployer as owner', async function () {
            expect(await this.TicketBeacon.owner()).to.equal(deployer.address);
        });

        it('should save the implementation', async function () {
            expect(await this.TicketBeacon.implementation()).to.equal(this.TicketImplementationAddress);
        });
    });
});