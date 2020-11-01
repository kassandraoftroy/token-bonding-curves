const ethers = require('ethers');
const fs = require('fs');

let contractData = JSON.parse(fs.readFileSync('./build/contracts/ERC20ContinuousToken.json'));
let abi = contractData["abi"];
let bytecode = contractData["bytecode"];
let erc20data = JSON.parse(fs.readFileSync('./build/contracts/TestERC20.json'));
let erc20abi = erc20data["abi"];
let erc20bytecode = erc20data["bytecode"];

const deployDCT = async (wallet, gasPrice, initialSupplyEth, reserveRatio) => {
    let factory = new ethers.ContractFactory(erc20abi, erc20bytecode, wallet);
    let deployTx = factory.getDeployTransaction('Stablecoin', 'DAI', 18, ethers.utils.parseEther("10000000"));
	deployTx.gasLimit = 4000000;
    deployTx.gasPrice = gasPrice;
    let c1addr;
	try {
		let tx = await wallet.sendTransaction(deployTx);
        console.log("dai deployment tx:", tx.hash);
        let receipt = await wallet.provider.getTransactionReceipt(tx.hash);
        c1addr = receipt.contractAddress;
	} catch(e) {
        console.log('error deploying:', e.message);
        return
    }
    factory = new ethers.ContractFactory(abi, bytecode, wallet);
	deployTx = factory.getDeployTransaction('Dai Continuous Token', 'DCT', 18, ethers.utils.parseEther(initialSupplyEth), reserveRatio, c1addr);
	deployTx.gasLimit = 6000000;
    deployTx.gasPrice = gasPrice;
	try {
		let tx = await wallet.sendTransaction(deployTx);
        console.log("dct deployment tx:", tx.hash);
        let receipt = await wallet.provider.getTransactionReceipt(tx.hash);
        return {dct: receipt.contractAddress, dai: c1addr};
	} catch(e) {
		console.log('error deploying:', e.message);
		return
	}
}

const testDCT = async (wallet, gasPrice, wallet2) => {
    let ethBal = await wallet.getBalance();
    let ethBal2 = await wallet.getBalance();
    console.log("---Wallet 1---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("DAI:", "none");
    console.log("DCT:", "none");
    console.log("---Wallet 2---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("DAI:", "none");
    console.log("DCT:", "none");
    console.log("--------------");
    console.log("Wallet 1 deploying dai and dct contracts...");
    let addresses = await deployDCT(wallet, gasPrice, "1000000000", 200000);
    let c1 = new ethers.Contract(addresses.dct, abi, wallet);
    let daic = new ethers.Contract(addresses.dai, erc20abi, wallet);
    await daic.functions.transfer(addresses.dct, ethers.utils.parseEther("1000").toString(), {gasLimit: 100000, gasPrice: gasPrice});
    await daic.functions.transfer(wallet2.address, ethers.utils.parseEther("1000000").toString(), {gasLimit: 100000, gasPrice: gasPrice});
    ethBal = await wallet.getBalance();
    let daiBal = await daic.functions.balanceOf(wallet.address);
    let tBal = await c1.functions.balanceOf(wallet.address);
    let daiBal2 = await daic.functions.balanceOf(wallet2.address);
    let tBal2 = await c1.functions.balanceOf(wallet2.address);
    let reward1m = await c1.functions.getContinuousMintReward(ethers.utils.parseEther("1000000"));
    let reward1 = await c1.functions.getContinuousMintReward(ethers.utils.parseEther("100"));
    let reserve = await c1.functions.reserveBalance();
    let supply = await c1.functions.totalSupply();
    console.log("---Wallet 1---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("DAI:", ethers.utils.formatEther(daiBal.toString()));
    console.log("DCT:", ethers.utils.formatEther(tBal.toString()));
    console.log("---Wallet 2---");
    console.log("ETH:", ethers.utils.formatEther(ethBal2.toString()));
    console.log("DAI:", ethers.utils.formatEther(daiBal2.toString()));
    console.log("DCT:", ethers.utils.formatEther(tBal2.toString()));
    console.log("--------------");
    console.log("Total supply DCT:", ethers.utils.formatEther(supply.toString()));
    console.log("Total reserve DAI:", ethers.utils.formatEther(reserve.toString()));
    console.log("For 100 DAI get:", ethers.utils.formatEther(reward1.toString()), "DCT");
    console.log("--------------");
    console.log("Wallet 2 minting (1m DAI worth of) DCT ...");
    let c2 = new ethers.Contract(addresses.dct, abi, wallet2);
    let daic2 = new ethers.Contract(addresses.dai, erc20abi, wallet2);
    await daic2.functions.approve(addresses.dct, ethers.utils.parseEther("1000000").toString(), {gasLimit: 100000, gasPrice: gasPrice});
    let tx = await c2.functions.mint(ethers.utils.parseEther("1000000").toString(), reward1m.toString(), {gasLimit: 150000, gasPrice: gasPrice});
    await wallet.provider.getTransactionReceipt(tx.hash);
    ethBal2 = await wallet2.getBalance();
    tBal2 = await c1.functions.balanceOf(wallet2.address);
    daiBal2 = await daic.functions.balanceOf(wallet2.address);
    reward1 = await c1.functions.getContinuousMintReward(ethers.utils.parseEther("100"));
    reserve = await c1.functions.reserveBalance();
    supply = await c1.functions.totalSupply();
    console.log("---Wallet 1---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("DAI:", ethers.utils.formatEther(daiBal.toString()));
    console.log("DCT:", ethers.utils.formatEther(tBal.toString()));
    console.log("---Wallet 2---");
    console.log("ETH:", ethers.utils.formatEther(ethBal2.toString()));
    console.log("DAI:", ethers.utils.formatEther(daiBal2.toString()));
    console.log("DCT:", ethers.utils.formatEther(tBal2.toString()));
    console.log("--------------");
    console.log("Total supply DCT:", ethers.utils.formatEther(supply.toString()));
    console.log("Total reserve DAI:", ethers.utils.formatEther(reserve.toString()));
    console.log("For 100 DAI get:", ethers.utils.formatEther(reward1.toString()), "DCT");
    console.log("--------------");
    console.log("Wallet 1 returning 100m DCT...");
    let mil100 = ethers.utils.parseEther("100000000");
    let refund = await c1.functions.getContinuousBurnRefund(mil100.toString());
    let tx2 = await c1.functions.burn(mil100.toString(), refund.toString(), {gasLimit: 150000, gasPrice: gasPrice});
    await wallet.provider.getTransactionReceipt(tx2.hash);
    ethBal = await wallet.getBalance();
    tBal = await c1.functions.balanceOf(wallet.address);
    daiBal = await daic.functions.balanceOf(wallet.address);
    ethBal2 = await wallet2.getBalance();
    tBal2 = await c1.functions.balanceOf(wallet2.address);
    daiBal2 = await daic.functions.balanceOf(wallet2.address);
    reward1 = await c1.functions.getContinuousMintReward(ethers.utils.parseEther("100"));
    reserve = await c1.functions.reserveBalance();
    supply = await c1.functions.totalSupply();
    console.log("---Wallet 1---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("DAI:", ethers.utils.formatEther(daiBal.toString()));
    console.log("DCT:", ethers.utils.formatEther(tBal.toString()));
    console.log("--------------");
    console.log("---Wallet 2---");
    console.log("ETH:", ethers.utils.formatEther(ethBal2.toString()));
    console.log("DAI:", ethers.utils.formatEther(daiBal2.toString()));
    console.log("DCT:", ethers.utils.formatEther(tBal2.toString()));
    console.log("--------------");
    console.log("Total supply DCT:", ethers.utils.formatEther(supply.toString()));
    console.log("Total reserve DAI:", ethers.utils.formatEther(reserve.toString()));
    console.log("For 100 DAI get:", ethers.utils.formatEther(reward1.toString()), "DCT");
    console.log("--------------");
}

(async () => {
	let args = process.argv;
	let providerURL = args[2];
	let provider = new ethers.providers.JsonRpcProvider(providerURL);
	let priv1 = args[3];
    let wallet1 = new ethers.Wallet(priv1, provider);
    let priv2 = args[4];
    let wallet2 = new ethers.Wallet(priv2, provider);
    let gasPrice = Number(args[5]);
    await testDCT(wallet1, gasPrice, wallet2)
})();