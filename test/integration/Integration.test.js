const { expect } = require("chai");
const { ethers } = require("hardhat");

let { NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE } = require("../utils/ticket");
let { RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH } = require('../utils/chainlink');

describe('Integration', async function () {
    beforeEach(async function () {
        [deployer, randomAcc] = await ethers.getSigners();

        this.TicketImplementation = await (await ethers.getContractFactory('Ticket')).deploy();

        CURRENT_BLOCK = Number(await network.provider.send('eth_blockNumber'));
        START_BLOCK = CURRENT_BLOCK + 5;
        END_BLOCK = START_BLOCK + 10;

        this.WinnerPicker = await (await ethers.getContractFactory('WinnerPicker')).deploy(RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH);
        this.TicketBeacon = await (await ethers.getContractFactory('TicketBeacon')).deploy(this.TicketImplementation.address);
        this.TicketFactory = await (await ethers.getContractFactory('TicketFactory')).deploy(this.TicketBeacon.address, this.WinnerPicker.address);

        await this.TicketFactory.deployTicketProxy(NAME, SYMBOL, (START_BLOCK).toString(), (END_BLOCK).toString(), PRICE);
        const deployedTicketProxies = await this.TicketFactory.deployedTicketProxies();
        const ticketProxyAddress = deployedTicketProxies[deployedTicketProxies.length - 1];

        this.TicketProxy = await ethers.getContractAt('TicketProxy', ticketProxyAddress, deployer);
        this.ProxiedTicket = (await ethers.getContractFactory('Ticket')).attach(ticketProxyAddress);
    });

    it('All contracts should save the same implementation address', async function () {
        expect(await this.TicketImplementation.address).to.equal(await this.TicketBeacon.implementation());
        expect(await this.TicketImplementation.address).to.equal(await this.TicketProxy.implementation());
    });

    it('All contracts should save the same beacon address', async function () {
        expect(await this.TicketFactory.BEACON_ADDRESS()).to.equal(this.TicketBeacon.address);
        expect(await this.TicketProxy.beacon()).to.equal(this.TicketBeacon.address);
    });

    it('Factory & beacon should save same owner', async function () {
        expect(await this.TicketFactory.owner()).to.equal(deployer.address);
        expect(await this.TicketBeacon.owner()).to.equal(deployer.address);
    });

    it('Factory should pass correct props', async function () {
        expect(await this.ProxiedTicket.name()).to.equal(NAME);
        expect(await this.ProxiedTicket.symbol()).to.equal(SYMBOL);
        expect(await this.ProxiedTicket.START_BLOCK_NUMBER()).to.equal(START_BLOCK);
        expect(await this.ProxiedTicket.END_BLOCK_NUMBER()).to.equal(END_BLOCK);
        expect(await this.ProxiedTicket.TICKET_PRICE()).to.equal(PRICE);
    });
});