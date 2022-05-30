const { expect } = require("chai");
const { ethers } = require("hardhat");

let { RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH } = require('../utils/chainlink');

describe('LotteryManager', async function () {
    beforeEach(async function () {
        [deployer, newOwner, randomAcc] = await ethers.getSigners();
        this.LotteryManager = await (await ethers.getContractFactory("LotteryManager")).deploy();
        this.TicketImplementationAddress = (await (await ethers.getContractFactory("Ticket")).deploy()).address;
        this.WinnerPickerAddress = (await (await ethers.getContractFactory("WinnerPicker"))
            .deploy(RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH)).address;
    });

    describe("Upon deployment", async function () {
        it('should set deployer as owner', async function () {
            expect(await this.LotteryManager.owner()).to.equal(deployer.address);
        });
    });

    describe("Lottery setup", async function () {
        it('should create the beacon contract passing it the ticket implementation', async function () {
            await this.LotteryManager.setupLottery(this.TicketImplementationAddress, this.WinnerPickerAddress);
            expect(await this.LotteryManager.ticketBeacon()).to.not.equal(ethers.constants.AddressZero);
        });

        it('should create the factory contract passing it the beacon address and the vrf consumer', async function () {
            await this.LotteryManager.setupLottery(this.TicketImplementationAddress, this.WinnerPickerAddress);
            expect(await this.LotteryManager.ticketFactory()).to.not.equal(ethers.constants.AddressZero);
        });

        it('should be access restricted ot only owner', async function () {
            await expect(this.LotteryManager.connect(randomAcc).setupLottery(this.TicketImplementationAddress, this.WinnerPickerAddress))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    beforeEach(async function () {
        await this.LotteryManager.setupLottery(this.TicketImplementationAddress, this.WinnerPickerAddress);
    });

    describe("Implementation management", async function () {
        beforeEach(async function () {
            this.newTicketImplementationAddress = (await (await ethers.getContractFactory("Ticket")).deploy()).address;
        });

        it('should pass the new implementation to the beacon', async function () {
            await this.LotteryManager.changeImplementation(this.newTicketImplementationAddress);
            const ticketBeacon = await ethers.getContractAt('TicketBeacon', await this.LotteryManager.ticketBeacon());
            expect(await ticketBeacon.implementation()).to.equal(this.newTicketImplementationAddress);
        });

        it('should emit event', async function () {
            expect(await this.LotteryManager.changeImplementation(this.newTicketImplementationAddress))
                .to.emit(this.LotteryManager, "ImplementationChanged")
                .withArgs(this.TicketImplementationAddress, this.newTicketImplementationAddress);
        });

        it('should be access restricted ot only owner', async function () {
            await expect(this.LotteryManager.connect(randomAcc).changeImplementation(this.newTicketImplementationAddress))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Ownership transfer ", async function () {
        it('should trasnfer beacon ownership to new owner', async function () {
            await this.LotteryManager.transferLotteryOwnership(newOwner.address);
            const ticketBeacon = await ethers.getContractAt('TicketBeacon', await this.LotteryManager.ticketBeacon());
            expect(await ticketBeacon.owner()).to.equal(newOwner.address);
        });

        it('should trasnfer factory ownership to new owner', async function () {
            await this.LotteryManager.transferLotteryOwnership(newOwner.address);
            const ticketFactory = await ethers.getContractAt('TicketFactory', await this.LotteryManager.ticketFactory());
            expect(await ticketFactory.owner()).to.equal(newOwner.address);
        });

        it('should emit event', async function () {
            expect(await this.LotteryManager.transferLotteryOwnership(newOwner.address))
                .to.emit(this.LotteryManager, "LotteryOwnershipTransferred")
                .withArgs(deployer.address, newOwner.address);
        });
    });
});