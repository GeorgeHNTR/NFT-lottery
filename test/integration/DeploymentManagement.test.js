const { expect } = require("chai");
const { ethers } = require("hardhat");

let { RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH } = require('../utils/chainlink');
let { NAME, SYMBOL, PRICE, getBlocks } = require("../utils/ticket");

describe('DeploymentManagement (LotteryManager-TicketFactory)', async function () {
    beforeEach(async function () {
        [deployer] = await ethers.getSigners();
        this.LotteryManager = await (await ethers.getContractFactory("LotteryManager")).deploy();

        this.TicketImplementationAddress = (await (await ethers.getContractFactory("Ticket")).deploy()).address;
        this.WinnerPickerAddress = (await (await ethers.getContractFactory("WinnerPicker"))
            .deploy(RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH)).address;

        await this.LotteryManager.setupLottery(this.TicketImplementationAddress, this.WinnerPickerAddress);

        this.TicketFactory = await ethers.getContractAt("TicketFactory", await this.LotteryManager.ticketFactory());

        this.BLOCKS = await getBlocks();
        this.PARAMS = [NAME, SYMBOL, this.BLOCKS.START_BLOCK, this.BLOCKS.END_BLOCK, PRICE];
    });

    it("Lottery manager should be able to deploy new ticket proxies", async function () {
        await this.LotteryManager.deployTicketProxy(...this.PARAMS);
        expect(await this.TicketFactory.latestTicketProxy()).to.not.equal(ethers.constants.AddressZero);
    });

    it.only("Lottery manager should not be able to deploy new ticket proxies if latest one has not finished", async function () {
        await this.LotteryManager.deployTicketProxy(...this.PARAMS);
        await expect(this.LotteryManager.deployTicketProxy(...this.PARAMS)).to.be.revertedWith("OnlyOneTicketAtTime()");
    });
});
