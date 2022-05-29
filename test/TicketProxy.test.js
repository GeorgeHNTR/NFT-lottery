const { expect } = require("chai");
const { ethers } = require("hardhat");

let { NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE } = require("./utils/ticket");
let { RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH } = require('./utils/chainlink');

describe('TicketProxy', () => {
    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();

        this.TicketImplementation = await (await ethers.getContractFactory('Ticket')).deploy();

        this.WinnerPicker = await (await ethers.getContractFactory('WinnerPicker')).deploy(RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH);
        this.TicketBeacon = await (await ethers.getContractFactory('TicketBeacon')).deploy(this.TicketImplementation.address);
        this.TicketFactory = await (await ethers.getContractFactory('TicketFactory')).deploy(this.TicketBeacon.address, this.WinnerPicker.address);

        CURRENT_BLOCK = Number(await network.provider.send('eth_blockNumber'));
        START_BLOCK = CURRENT_BLOCK + 5;
        END_BLOCK = START_BLOCK + 10;

        await this.TicketFactory.deployTicketProxy(NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE);
        const deployedTicketProxyAddress = (await this.TicketFactory.deployedTicketProxies())[0];
        this.deployedTicketProxy = await ethers.getContractAt('TicketProxy', deployedTicketProxyAddress);
    });

    describe("Upon deployment", async function () {
        it('should save correct beacon address', async function () {
            expect(await this.deployedTicketProxy.beacon()).to.equal(this.TicketBeacon.address);
        });

        it('should save correct implementation address', async function () {
            expect(await this.deployedTicketProxy.implementation()).to.equal(this.TicketImplementation.address);
        });
    });
});