require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require('dotenv').config({path:__dirname+'/.env'})

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const getHDWallet = () => {
  const { MNEMONIC, PRIVATE_KEY } = process.env;
  if (MNEMONIC && MNEMONIC !== "") {
    return {
      mnemonic: MNEMONIC,
    }
  }
  if (PRIVATE_KEY && PRIVATE_KEY !== "") {
    return [PRIVATE_KEY]
  }
  throw Error("Private Key Not Set! Please set up .env");
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    mumbai: {
      url: 'https://rpc.ankr.com/polygon_mumbai',
      accounts: getHDWallet(),
    },
    // goerli: {
    //   url: 'https://rpc.ankr.com/eth_goerli',
    //   accounts: getHDWallet(),
    // },
    // mainnet: {
    //   url: 'https://rpc.ankr.com/eth',
    //   accounts: getHDWallet(),
    // },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYSCAN_API_KEY,
      polygonMumbai: process.env.POLYSCAN_API_KEY,
    }
  },
  solidity: {
    version: "0.8.8",
    settings: {
      optimizer: {
        enabled: process.env.DEBUG ? false: true,
      }
    }
  }
};
