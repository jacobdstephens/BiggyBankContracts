const { assert, expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers, web3 } = require("hardhat");
const Web3 = require('web3')
const deployargs = require('../scripts/deploy-verification-arguments')

require('chai')
  .use(require('chai-as-promised'))
  .should()

let BiggieBank;
let contract;
let accounts;

before(async () => {
  BiggieBank = await ethers.getContractFactory("BiggieBank");
  contract = await BiggieBank.deploy(...deployargs);
  accounts = await ethers.getSigners();
})

describe('deployment', async () => {
  it('deploys successfully', async () => {
    const address = contract.address
    assert.notEqual(address, '0x0')
    assert.notEqual(address, null)
    assert.notEqual(address, undefined)
    assert.notEqual(address, '')
  })

  it('has a name', async () => {
    const name = await contract.name()
    assert.equal(name, 'BiggieBank')
  })

  it('has a symbol', async () => {
    const symbol = await contract.symbol()
    assert.equal(symbol, 'BB')
  })
})

describe('minting', async () => {
  it('can mint 1 token', async () => {
    const contractAddress = contract.address;
    const mintCount = 1;
    const currentSupply = await contract.totalSupply();
    const nonce = await ethers.provider.getTransactionCount(accounts[0].address, 'latest'); //get latest nonce
    //the transaction
    const tx = {
      'from': accounts[0].address,
      'to': contractAddress,
      'nonce': nonce,
      'gasLimit': 500000,
      // maxFeePerGas: new web3.utils.BN(web3.utils.toWei('250', 'gwei')),
      // maxPriorityFeePerGas: new web3.utils.BN(web3.utils.toWei('4', 'gwei')),
      'value': BigNumber.from(0).toHexString(),
      'data': contract.interface.encodeFunctionData('mint', [mintCount, accounts[0].address]),
    };
    const result = await accounts[0].sendTransaction(tx);

    const totalSupply = await contract.totalSupply();
    // SUCCESS
    assert.equal(BigNumber.from(totalSupply).toNumber(), BigNumber.from(currentSupply).toNumber() + mintCount)
  })

  it('can mint 5 tokens', async () => {
    const mintCount = 5;
    const contractAddress = contract.address;
    const currentSupply = await contract.totalSupply();
    const nonce = await ethers.provider.getTransactionCount(accounts[0].address, 'latest'); //get latest nonce
    //the transaction
    const tx = {
      'from': accounts[0].address,
      'to': contractAddress,
      'nonce': nonce,
      'gasLimit': 5000000,
      // maxFeePerGas: new web3.utils.BN(web3.utils.toWei('250', 'gwei')),
      // maxPriorityFeePerGas: new web3.utils.BN(web3.utils.toWei('4', 'gwei')),
      'value': BigNumber.from(Web3.utils.toWei('0', 'ether')).toHexString(),
      'data': contract.interface.encodeFunctionData('mint', [mintCount, accounts[0].address]),
    };
    const result = await accounts[0].sendTransaction(tx);

    const totalSupply = await contract.totalSupply();
    // SUCCESS
    assert.equal(BigNumber.from(totalSupply).toNumber(), BigNumber.from(currentSupply).toNumber() + mintCount)
  })

  it('account has balance of totalSupply', async () => {
    const balance = await contract.balanceOf(accounts[0].address)
    const totalSupply = await contract.totalSupply()

    // success
    assert.equal(balance.toNumber(), totalSupply.toNumber(), `has ${totalSupply} token balance`);
  })
})

describe('pause', async () => {
  it('can pause contract', async () => {
    await expect(contract.setPause(true)).to.eventually.be.fulfilled;

    const contractAddress = contract.address;
    const mintCount = 1;
    const nonce = await ethers.provider.getTransactionCount(accounts[0].address, 'latest'); //get latest nonce
    //the transaction
    const tx = {
      'from': accounts[0].address,
      'to': contractAddress,
      'nonce': nonce,
      'gasLimit': 500000,
      // maxFeePerGas: new web3.utils.BN(web3.utils.toWei('250', 'gwei')),
      // maxPriorityFeePerGas: new web3.utils.BN(web3.utils.toWei('4', 'gwei')),
      'value': BigNumber.from(Web3.utils.toWei('1', 'ether')).toHexString(),
      'data': contract.interface.encodeFunctionData('mint', [mintCount, accounts[0].address]),
    };
    await expect(accounts[0].sendTransaction(tx)).to.eventually.be.rejected;
  })

  it('can unpause contract', async () => {
    // todo: need to ensure all tokens are minted before attempting to lock, or it will fail
    await expect(contract.setPause(false)).to.eventually.be.fulfilled;

    const contractAddress = contract.address;
    const mintCount = 1;
    const nonce = await ethers.provider.getTransactionCount(accounts[0].address, 'latest'); //get latest nonce
    //the transaction
    const tx = {
      'from': accounts[0].address,
      'to': contractAddress,
      'nonce': nonce,
      'gasLimit': 500000,
      // maxFeePerGas: new web3.utils.BN(web3.utils.toWei('250', 'gwei')),
      // maxPriorityFeePerGas: new web3.utils.BN(web3.utils.toWei('4', 'gwei')),
      'value': BigNumber.from(Web3.utils.toWei('1', 'ether')).toHexString(),
      'data': contract.interface.encodeFunctionData('mint', [mintCount, accounts[0].address]),
    };
    await expect(accounts[0].sendTransaction(tx)).to.eventually.be.fulfilled;
  })
})

describe('max supply', async () => {
  it('can\'t set max supply below current supply', async () => {
    // todo: need to ensure all tokens are minted before attempting to lock, or it will fail
    await expect(contract.setMaxElements(1)).to.eventually.be.rejected;
  })

  it('can set max supply', async () => {
    await expect(contract.setMaxElements(1000)).to.eventually.be.fulfilled;
  })
})

describe('lock', async () => {
  it('can\'t lock', async () => {
    await expect(contract.lock()).to.eventually.be.rejected
  })
})

describe('burn', async () => {
  it('can burn token', async () => {
    const prevTokenAtIndex2 = await contract.tokenOfOwnerByIndex(accounts[0].address, 2);

    await expect(contract.burn(prevTokenAtIndex2.toNumber())).to.eventually.be.fulfilled

    const newTokenAtIndex2 = await contract.tokenOfOwnerByIndex(accounts[0].address, 2);

    assert.notEqual(newTokenAtIndex2.toNumber(), prevTokenAtIndex2.toNumber())
  })

  it('burned token is sent to null address', async () => {
    await expect(contract.ownerOf(2)).to.eventually.be.rejected
  })
})