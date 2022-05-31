const { expect } = require("chai");
const { ethers } = require("hardhat");

let { RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH } = require('../utils/chainlink');
let { NAME, SYMBOL, PRICE, getBlocks } = require("../utils/ticket");

describe('BeaconProxiesImplementations (LotteryManager-TicketFactory-TicketBeacon-TicketProxy)', async function () {
    beforeEach(async function () {
        [deployer] = await ethers.getSigners();
        this.LotteryManager = await (await ethers.getContractFactory("LotteryManager")).deploy();

        this.TicketImplementationAddress = (await (await ethers.getContractFactory("Ticket")).deploy()).address;
        this.WinnerPickerAddress = (await (await ethers.getContractFactory("WinnerPicker"))
            .deploy(RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH)).address;

        await this.LotteryManager.setupLottery(this.TicketImplementationAddress, this.WinnerPickerAddress);

        this.TicketBeacon = await ethers.getContractAt("TicketBeacon", await this.LotteryManager.ticketBeacon());
        this.TicketFactory = await ethers.getContractAt("TicketFactory", await this.LotteryManager.ticketFactory());

        this.BLOCKS = await getBlocks();
        this.PARAMS = [NAME, SYMBOL, this.BLOCKS.START_BLOCK, this.BLOCKS.END_BLOCK, PRICE];

        await this.LotteryManager.deployTicketProxy(...this.PARAMS);
        this.TicketProxy = await ethers.getContractAt("TicketProxy", await this.TicketFactory.latestTicketProxy());
    });

    it("Proxies implementation should be fetched from the beacon", async function () {
        expect(await this.TicketProxy.implementation()).to.equal(await this.TicketBeacon.implementation());
    });

    it("Lottery manager should be able to change the proxies implementation", async function () {
        const newImplementation = (await (await ethers.getContractFactory("Ticket")).deploy()).address;
        this.LotteryManager.changeImplementation(newImplementation);
        expect(await this.TicketProxy.implementation()).to.equal(newImplementation);
        expect(await this.TicketBeacon.implementation()).to.equal(newImplementation);
    });

});
