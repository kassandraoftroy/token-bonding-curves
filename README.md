# Token Bonding Curves 

Smart Contracts in solidity for issuing continuous tokens with a token bonding curve on ethereum. Forked from this [repo](https://github.com/yosriady/continuous-token) and companion [article](https://yos.io/2018/11/10/bonding-curves/) 

The only meaningful change is in front running mitigation - I went with the uniswap-esque slippage tolerance (as opposed to a gas limit approach).

# Install

Requires: Node, ganache-cli, (truffle, if you want to recompile contracts)


1. Clone Repo
2. npm install
3. In separate process `ganache-cli -s bonding-curves -e 2000 -p 8545`
4. Run either test file: `node testEthCT.js http://127.0.0.1:8545 0x3dcab94b7ae1475f0e2de48eadb8434150295db2901a4bc907ddc5049ac6510a 0xaac57549b939583f92220a59b27a1dc7e93dd3478c248e01ec4fd748385545c8 35000000000`




