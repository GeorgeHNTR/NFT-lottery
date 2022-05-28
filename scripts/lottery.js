const { ethers } = require("hardhat");

async function main() {
    const TicketImplementation = await (await ethers.getContractFactory('Ticket')).deploy();
    console.log("The Ticket contract implementation has been deployed to:", TicketImplementation.address);

    const TicketBeacon = await (await ethers.getContractFactory('TicketBeacon')).deploy(TicketImplementation.address);
    console.log("The Ticket Beacon has been deployed to:", TicketBeacon.address);

    const TicketFactory = await (await ethers.getContractFactory('TicketFactory')).deploy(TicketBeacon.address);
    console.log("The Ticket Factory has been deployed to:", TicketFactory.address);

    if ((await ethers.getSigner()).address !== await TicketBeacon.owner()) throw new Error(">>> Error occured: Setting owner to deployed beacon went wrong!");
    console.log("The current admin/owner of the beacon contract is:", (await ethers.getSigner()).address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });