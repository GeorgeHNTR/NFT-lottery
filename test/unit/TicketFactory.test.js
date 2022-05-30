const { expect } = require("chai");
const { ethers } = require("hardhat");

let { RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH } = require('../utils/chainlink');
let { NAME, SYMBOL, PRICE, getBlocks } = require("../utils/ticket");

describe('TicketFactory', async function () {
    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();
        this.TicketImplementationAddress = (await (await ethers.getContractFactory("Ticket")).deploy()).address;
        this.TicketBeaconAddress = (await (await ethers.getContractFactory("TicketBeacon"))
            .deploy(this.TicketImplementationAddress)).address;
        this.WinnerPickerAddress = (await (await ethers.getContractFactory("WinnerPicker"))
            .deploy(RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH)).address;
        this.TicketFactory = await (await ethers.getContractFactory("TicketFactory"))
            .deploy(this.TicketBeaconAddress, this.WinnerPickerAddress);
    });

    describe("Upon deployment", async function () {
        it('should save the beacon address', async function () {
            expect(await this.TicketFactory.BEACON_ADDRESS()).to.equal(this.TicketBeaconAddress);
        });

        it('should save the vrf consumer address', async function () {
            expect(await this.TicketFactory.VRF_CONSUMER()).to.equal(this.WinnerPickerAddress);
        });
    });

    describe("Deployments", async function () {
        beforeEach(async function () {
            this.BLOCKS = await getBlocks();
            this.PARAMS = [NAME, SYMBOL, this.BLOCKS.START_BLOCK, this.BLOCKS.END_BLOCK, PRICE];
            this.salt = 1;
        });

        it('should be access restricted to only owner (normal)', async function () {
            await expect(this.TicketFactory.deployTicketProxy(...this.PARAMS)).to.not.be.revertedWith("Ownable: caller is not the owner");
            await expect(this.TicketFactory.connect(randomAcc).deployTicketProxy(...this.PARAMS)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it('should be access restricted to only owner (deterministic)', async function () {
            await expect(this.TicketFactory.deployTicketProxyDeterministic(...this.PARAMS, this.salt)).to.not.be.revertedWith("Ownable: caller is not the owner");
            await expect(this.TicketFactory.connect(randomAcc).deployTicketProxyDeterministic(...this.PARAMS, this.salt)).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it('should emit event (normal)', async function () {
            await expect(this.TicketFactory.deployTicketProxy(...this.PARAMS))
                .to.emit(this.TicketFactory, "NewLotteryDeployed");
        });

        it('should emit event (deterministic)', async function () {
            await expect(this.TicketFactory.deployTicketProxyDeterministic(...this.PARAMS, this.salt))
                .to.emit(this.TicketFactory, "NewLotteryDeployed");
        });
    });

    describe("Getters", async function () {
        it('should provide getter for the address of the latest deployed proxy', async function () {
            expect(await this.TicketFactory.latestTicketProxy()).to.equal(ethers.constants.AddressZero);
        });

        it('should provide getter for an array of the address of the all evert proxies deployed', async function () {
            expect(await this.TicketFactory.deployedTicketProxies()).to.be.empty;
        });
    });
});