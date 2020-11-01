const ethers = require('ethers');
const fs = require('fs');

let contractData = JSON.parse(fs.readFileSync('./build/contracts/ETHContinuousToken.json'));
let abi = contractData["abi"];
let bytecode = contractData["bytecode"];

const deployECT = async (wallet, gasPrice, initialReserveEth, initialSupplyEth, reserveRatio) => {
    let factory = new ethers.ContractFactory(abi, bytecode, wallet);
	let deployTx = factory.getDeployTransaction('Basic Continuous Token', 'CT', 18, ethers.utils.parseEther(initialSupplyEth), reserveRatio);
	deployTx.gasLimit = 6000000;
    deployTx.gasPrice = gasPrice;
    if (initialReserveEth != "0") {
        deployTx.value = ethers.utils.parseEther(initialReserveEth);
    }
	try {
		let tx = await wallet.sendTransaction(deployTx);
        console.log("ct deployment tx:", tx.hash);
        let receipt = await wallet.provider.getTransactionReceipt(tx.hash);
        return receipt.contractAddress
	} catch(e) {
		console.log('error deploying:', e.message);
		return
	}
}

const testECT = async (wallet, gasPrice, wallet2) => {
    let ethBal = await wallet.getBalance();
    let ethBal2 = await wallet.getBalance();
    console.log("---Wallet 1---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("CT:", "none");
    console.log("--------------");
    console.log("---Wallet 2---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("CT:", "none");
    console.log("--------------");
    console.log("Wallet 1 deploying CT contract...", );
    let c1addr = await deployECT(wallet, gasPrice, "1", "1000000", 200000);
    let c1 = new ethers.Contract(c1addr, abi, wallet);
    let c2 = new ethers.Contract(c1addr, abi, wallet2);
    ethBal = await wallet.getBalance();
    let tBal = await c1.functions.balanceOf(wallet.address);
    let tBal2 = await c1.functions.balanceOf(wallet2.address);
    let reserve = await c1.functions.reserveBalance();
    let supply = await c1.functions.totalSupply();
    let reward1 = await c1.functions.getContinuousMintReward(ethers.utils.parseEther("1"));
    let reward1k = await c1.functions.getContinuousMintReward(ethers.utils.parseEther("1000"));
    console.log("---Wallet 1---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("CT:", ethers.utils.formatEther(tBal.toString()));
    console.log("---Wallet 2---");
    console.log("ETH:", ethers.utils.formatEther(ethBal2.toString()));
    console.log("CT:", ethers.utils.formatEther(tBal2.toString()));
    console.log("--------------");
    console.log("Total supply CT:", ethers.utils.formatEther(supply.toString()));
    console.log("Total reserve ETH:", ethers.utils.formatEther(reserve.toString()));
    console.log("For 1 ETH get:", ethers.utils.formatEther(reward1.toString()), "CT");
    console.log("--------------");
    console.log("Wallet 2 minting (1k ETH worth of) CT...")
    let tx = await c2.functions.mint(reward1k.toString(), {value: ethers.utils.parseEther("1000"), gasLimit: 150000, gasPrice: gasPrice});
    await wallet.provider.getTransactionReceipt(tx.hash);
    ethBal2 = await wallet2.getBalance();
    tBal2 = await c1.functions.balanceOf(wallet2.address);
    reserve = await c1.functions.reserveBalance();
    supply = await c1.functions.totalSupply();
    reward1 = await c1.functions.getContinuousMintReward(ethers.utils.parseEther("1"));
    console.log("---Wallet 1---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("CT:", ethers.utils.formatEther(tBal.toString()));
    console.log("---Wallet 2---");
    console.log("ETH:", ethers.utils.formatEther(ethBal2.toString()));
    console.log("CT:", ethers.utils.formatEther(tBal2.toString()));
    console.log("--------------");
    console.log("Total supply CT:", ethers.utils.formatEther(supply.toString()));
    console.log("Total reserve ETH:", ethers.utils.formatEther(reserve.toString()));
    console.log("For 1 ETH get:", ethers.utils.formatEther(reward1.toString()), "CT");
    console.log("--------------");
    console.log("Wallet 1 returning 100k CT...");
    let k100 = ethers.utils.parseEther("100000");
    let refund = await c1.functions.getContinuousBurnRefund(k100.toString());
    let tx2 = await c1.functions.burn(k100.toString(), refund.toString(), {gasLimit: 150000, gasPrice: gasPrice});
    await wallet.provider.getTransactionReceipt(tx2.hash);
    ethBal = await wallet.getBalance();
    tBal = await c1.functions.balanceOf(wallet.address);
    ethBal2 = await wallet2.getBalance();
    tBal2 = await c1.functions.balanceOf(wallet2.address);
    reserve = await c1.functions.reserveBalance();
    supply = await c1.functions.totalSupply();
    reward1 = await c1.functions.getContinuousMintReward(ethers.utils.parseEther("1"));
    console.log("---Wallet 1---");
    console.log("ETH:", ethers.utils.formatEther(ethBal.toString()));
    console.log("CT:", ethers.utils.formatEther(tBal.toString()));
    console.log("---Wallet 2---");
    console.log("ETH:", ethers.utils.formatEther(ethBal2.toString()));
    console.log("CT:", ethers.utils.formatEther(tBal2.toString()));
    console.log("--------------");
    console.log("Total supply CT:", ethers.utils.formatEther(supply.toString()));
    console.log("Total reserve ETH:", ethers.utils.formatEther(reserve.toString()));
    console.log("For 1 ETH get:", ethers.utils.formatEther(reward1.toString()), "CT");
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
    await testECT(wallet1, gasPrice, wallet2);
})();
