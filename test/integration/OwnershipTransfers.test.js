const { expect } = require("chai");
const { ethers } = require("hardhat");

let { RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH } = require('../utils/chainlink');
let { NAME, SYMBOL, PRICE, getBlocks } = require("../utils/ticket");

describe.only('OwnershipTransfers (LotteryManager-TicketFactory-TicketBeacon)', async function () {
    beforeEach(async function () {
        [deployer, newOwner] = await ethers.getSigners();
        this.LotteryManager = await (await ethers.getContractFactory("LotteryManager")).deploy();

        this.TicketImplementationAddress = (await (await ethers.getContractFactory("Ticket")).deploy()).address;
        this.WinnerPickerAddress = (await (await ethers.getContractFactory("WinnerPicker"))
            .deploy(RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH)).address;

        await this.LotteryManager.setupLottery(this.TicketImplementationAddress, this.WinnerPickerAddress);

        this.TicketBeacon = await ethers.getContractAt("TicketBeacon", await this.LotteryManager.ticketBeacon());
        this.TicketFactory = await ethers.getContractAt("TicketFactory", await this.LotteryManager.ticketFactory());

        this.BLOCKS = await getBlocks();
        this.PARAMS = [NAME, SYMBOL, this.BLOCKS.START_BLOCK, this.BLOCKS.END_BLOCK, PRICE];
    });

    it("Both factory and beacon should be owned by the lottery manager", async function () {
        expect(await this.TicketFactory.owner()).to.equal(this.LotteryManager.address);
        expect(await this.TicketBeacon.owner()).to.equal(this.LotteryManager.address);
    });

    it("Both factory and beacon should change owner once the lottery manager decides to", async function () {
        await this.LotteryManager.transferLotteryOwnership(newOwner.address);
        expect(await this.TicketFactory.owner()).to.equal(newOwner.address);
        expect(await this.TicketBeacon.owner()).to.equal(newOwner.address);
    });
});
