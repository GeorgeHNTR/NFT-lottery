const { ethers } = require("hardhat");

const NAME = 'Ticket';

const SYMBOL = 'TCKT';

const START_BLOCK = Math.round(Date.now() / 1000) + 5 * 60;

const END_BLOCK = START_BLOCK + 2 * 60 * 60;

const PRICE = ethers.utils.parseEther('0.0001');

module.exports = { NAME, SYMBOL, START_BLOCK, END_BLOCK, PRICE };
