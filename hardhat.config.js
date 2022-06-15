require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require('hardhat-docgen');
require("hardhat-gas-reporter");
require("solidity-coverage");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.13",
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
  gasReporter: {
    currency: 'USD',
    // coinmarketcap: process.env.API_KEY__COINMARKETCAP
  }
  // networks: {
  //   rinkeby: {
  //     url: `https://rinkeby.infura.io/v3/0dc62080d95a458fbcd7bd0e28a1a95d`,
  //     accounts: [process.env.PRIVATE_KEY__RINKEBY]
  //   },
  //   mainnet: {
  //     url: `https://mainnet.infura.io/v3/0dc62080d95a458fbcd7bd0e28a1a95d`,
  //     accounts: [process.env.PRIVATE_KEY__RINKEBY]
  //   }
  // }
};
