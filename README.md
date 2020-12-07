![Build Status](https://github.com/DataHighway-DHX/deployer/workflows/CI/badge.svg)

## DHX lockdrop contract deployer

```
Your
Description
Here

/TODO/
```

## Getting Started

#### Compile contract (optional) (using Remix):

1. Go to Remix https://remix.ethereum.org
2. Open the ./contracts folder (of https://github.com/DataHighway-DHX/mining) in Remix
3. Change imports so they compile in the browser (e.g. change import "./interface/ERC20.sol"; to import "./ERC20.sol";)
4. Go to "Solidity Compiler" tab, pick compiler version 0.5.17, click "Compile Lockdrop.sol"
5. Copy ABI code to `./contracts/lockdrop.abi.json`, Bytecode to `./contracts/lockdrop.code`
6. Copy ABI code of Lock to `./contracts/lock.abi.json`, Bytecode to `./contracts/lock.code`
6. Copy ABI code of ERC20 to `./contracts/erc20.abi.json`, Bytecode to `./contracts/erc20.code`

#### Setup Ethereum account (using Metamask)

1. Download [Metamask](https://metamask.io/) extension
2. Follow "Get started" steps to create (or import) Ethereum account
3. Go to "Account details" and export private key

#### Configure deployer parameters

1. Copy `.env.example` to `.env`
2. Ensure that `CONTRACT_*_ABI_SOURCE` and `CONTRACT_*_CODE_SOURCE` are paths to files from "Contract compilation" section (optional)
3. Replace `0xSAMPLE_ADDRESS` with account address from "Setup Ethereum account section", replace `SAMPLE_PRIVATE_KEY` with private key
4. Register your [Infura account](https://infura.io/), create a project. Replace `wss://goerli.infura.io/ws/v3/INFURA_SAMPLE_WSS` with WSS endpoint taken from Infura.
5. Make sure `CHAIN_TYPE` equals to first section of domain from the previous step (e.g. goerli, mainnet, ropsten).

#### Download dependencies, build and run deployer

```
$ yarn install
$ yarn run build
$ yarn run serve
```

#### Run in docker, using docker-compose

1. Install docker and docker-compose
2. Configure deployer parameters as in above steps
3. Start the containers, the image will be build if it does not exists yet locally

```
$ docker-compose up -d
```
