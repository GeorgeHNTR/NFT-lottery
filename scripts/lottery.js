const { ethers } = require("hardhat");

let {
    MAINNET__VRF_COORDINATOR, MAINNET__LINK_TOKEN, MAINNET__KEYHASH,
    RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH,
} = require('../test/utils/chainlink');

async function main() {
    [deployer] = await ethers.getSigners();

    let chainlinkCredentials;
    if (hre.network.name === 'mainnet' || hre.network.name === 'hardhat') {
        chainlinkCredentials = [MAINNET__VRF_COORDINATOR, MAINNET__LINK_TOKEN, MAINNET__KEYHASH];
    } else if (hre.network.name === 'rinkeby') {
        chainlinkCredentials = [RINKEBY__VRF_COORDINATOR, RINKEBY__LINK_TOKEN, RINKEBY__KEYHASH];
    } else {
        throw new Error(" >>> Error occurred: Chain not supported. Please switch to hardhat, mainnet or rinkeby.");
    };

    console.log('\n', Array(105).join('-'), '\n');

    const LotteryManager = await (await ethers.getContractFactory("LotteryManager")).deploy();
    console.log("  >>> Lottery manager deployed to:                         ", LotteryManager.address);

    const TicketImplementation = await (await ethers.getContractFactory("Ticket")).deploy();
    console.log("  >>> Ticket contract implementation deployed to:          ", TicketImplementation.address);

    const WinnerPicker = await (await ethers.getContractFactory("WinnerPicker")).deploy(...chainlinkCredentials);
    console.log("  >>> VRF Consumer winner picker contract deployed to:     ", WinnerPicker.address);

    console.log('\n', "   > Setting up the lottery..");
    await LotteryManager.setupLottery(TicketImplementation.address, WinnerPicker.address);
    console.log("    > Lottery set up!", '\n');

    const TicketBeacon = await ethers.getContractAt("TicketBeacon", await LotteryManager.ticketBeacon());
    console.log("  >>> Ticket beacon deployed to:                           ", TicketBeacon.address);

    const TicketFactory = await ethers.getContractAt("TicketFactory", await LotteryManager.ticketFactory());
    console.log("  >>> Ticket factory deployed to:                          ", TicketFactory.address);

    console.log('\n', Array(105).join('-'), '\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
