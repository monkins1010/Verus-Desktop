const ethers = require('ethers');
const { scientificToDecimal } = require('../numbers');
const Web3Interface = require('../utils/web3/web3Interface');

// speed: slow, average, fast
module.exports = (api) => {  
  /**
   * Preflights an ERC20 tx
   * @param {String} contractId
   * @param {String} address 
   * @param {String} amount 
   * @param {Object} params 
   * @returns Object
   */
   api.erc20.txPreflight = async (contractId, address, amount, params = {}) => {
    if (api.erc20.contracts[contractId] == null) {
      throw new Error(`No interface to connect to ${contractId} for tx preflight call`)
    } else if (api.erc20.wallet == null) {
      throw new Error('No ERC20 wallet authenticated to use for tx preflight call')
    }

    const web3Provider = api.erc20.contracts[contractId]

    const fromAddress = api.erc20.wallet.address
    const signer = new ethers.VoidSigner(fromAddress, web3Provider.interface.DefaultProvider)
    const contract = web3Provider.contract.connect(signer)
    const balance = await contract.balanceOf(signer.getAddress())
    const gasPrice = await web3Provider.interface.DefaultProvider.getGasPrice()
    const amountBn = ethers.utils.parseUnits(
      scientificToDecimal(amount),
      web3Provider.decimals
    );
    let gasEst = null
    let transaction = null 

    try {
      gasEst = await contract.estimateGas.transfer(address, amountBn)
      transaction = await contract.callStatic.transfer(
        address,
        amountBn
      );
    } catch(e) {   
      api.log(e.message, 'erc20_preflight')   
      throw new Error(Web3Interface.decodeWeb3Error(e.message).message)
    }
    
    const maxFee = gasEst.mul(gasPrice)
    
    return {
      chainTicker: web3Provider.symbol,
      to: address,
      from: fromAddress,
      balance: ethers.utils.formatUnits(balance, web3Provider.decimals),
      value: ethers.utils.formatUnits(amountBn, web3Provider.decimals),
      fee: ethers.utils.formatEther(maxFee),
      total: ethers.utils.formatUnits(amountBn, web3Provider.decimals),
      remainingBalance: ethers.utils.formatUnits(
        balance.sub(amountBn),
        web3Provider.decimals
      ),
      gasPrice: ethers.utils.formatEther(gasPrice),
      gasLimit: ethers.utils.formatEther(gasEst),
      warnings: [],
      transaction,
      decimals: web3Provider.decimals,
    };
  }

  api.erc20.sendTx = async (contractId, address, amount) => {
    if (api.erc20.contracts[contractId] == null) {
      throw new Error(`No interface to connect to ${contractId} for tx send call`)
    } else if (api.erc20.wallet == null) {
      throw new Error('No ERC20 wallet authenticated to use for tx send call')
    }

    const web3Provider = api.erc20.contracts[contractId]

    await api.erc20.txPreflight(contractId, address, amount)
    
    const privKey = api.erc20.wallet.signer.signingKey.privateKey
    const dummySigner = new ethers.VoidSigner(api.erc20.wallet.address, web3Provider.interface.DefaultProvider)
    const contract = web3Provider.contract.connect(dummySigner)
    const gasPrice = await web3Provider.interface.DefaultProvider.getGasPrice()
    const amountBn = ethers.utils.parseUnits(
      scientificToDecimal(amount),
      web3Provider.decimals
    );
    const signableContract = web3Provider.contract.connect(
      new ethers.Wallet(
        ethers.utils.hexlify(privKey),
        web3Provider.interface.InfuraProvider
      )
    );
    let gasEst = null
    let response = null

    try {
      gasEst = await contract.estimateGas.transfer(address, amountBn)
      response = await signableContract.transfer(
        address,
        amountBn
      );
    } catch(e) {    
      api.log(e.message, 'erc20_sendtx')  
      throw new Error(Web3Interface.decodeWeb3Error(e.message).message)
    }

    const maxFee = gasEst.mul(gasPrice)

    if (!api.erc20.contracts[contractId].temp.pending_txs[response.hash]) {
      api.erc20.contracts[contractId].temp.pending_txs[response.hash] = {
        hash: response.hash,
        confirmations: 0,
        from: response.from,
        gasPrice: response.gasPrice,
        gasLimit: response.gasLimit,
        to: address,
        value: amountBn,
        nonce: response.nonce,
        data: response.data,
        chainId: response.data
      }
    }
    
    return {
      to: address,
      from: response.from,
      fee: Number(ethers.utils.formatUnits(maxFee, web3Provider.decimals)),
      value: ethers.utils.formatUnits(amountBn, web3Provider.decimals),
      txid: response.hash
    };
  }

  api.setPost('/erc20/sendtx', async (req, res, next) => {
    const { chainTicker, toAddress, amount } = req.body

    try {
      res.send(JSON.stringify({
        msg: 'success',
        result: await api.erc20.sendTx(chainTicker, toAddress, amount.toString()),
      }));
    } catch(e) {
      const retObj = {
        msg: 'error',
        result: e.message,
      };
      res.send(JSON.stringify(retObj));
    }
  });

  api.setPost('/erc20/tx_preflight', async (req, res, next) => {
    const { chainTicker, toAddress, amount } = req.body

    try {
      res.send(JSON.stringify({
        msg: 'success',
        result: await api.erc20.txPreflight(chainTicker, toAddress, amount.toString()),
      }));
    } catch(e) {
      const retObj = {
        msg: 'error',
        result: e.message,
      };
      res.send(JSON.stringify(retObj));
    }
  });
    
  return api;
};