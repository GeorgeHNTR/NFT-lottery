const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.only('LotteryManager', async function () {
    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();
    });

    describe('basic test', async function () {
        it('should set owner', async function () {
            const LotteryManager = await (await ethers.getContractFactory("LotteryManager")).deploy();
            expect(await LotteryManager.owner()).to.equal(deployer.address);
        });
    });
});