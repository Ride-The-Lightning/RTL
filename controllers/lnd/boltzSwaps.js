var request = require('request-promise');
var fs = require('fs');
var common = require('../../common');
var logger = require('../logger');
var EventSource = require('eventsource');
var bitcoinjs = require('bitcoinjs-lib');
var boltzCore = require('boltz-core');
var streamMap = {};
let network = undefined;
const SWAP_STATUS = 'swapstatus';
const STREAM_SWAP_STATUS = 'streamswapstatus';
const GET_FEE_ESTIMATION = 'getfeeestimation';
const GET_SWAP_TRANSACTION = 'getswaptransaction';
const BROADCAST_TRANSACTION = 'broadcasttransaction';
const currency = 'BTC';
const swapExpiredSec = 86400000; // one day
const infoController = require("../../controllers/lnd/getInfo");



function getBoltzServerUrl() {
  if(common.selectedNode.boltz_server_url) {
    return common.selectedNode.boltz_server_url;
  } else {
    switch(network) {
      case 'mainnet':
        return 'https://boltz.exchange/api/';
      case 'regtest':
        return 'http://localhost:9001/'
      case 'testnet':
        return 'https://testnet.boltz.exchange/api/';
    }
  }
}


function getFilesList(callback) {
  let files_list = [];
  let all_restore_exists = false;
  fs.readdir(common.selectedNode.boltz_swaps_path, function (err, files) {
    const boltzFiles = files.filter(file => file.includes('.boltz'));
    if (err && err.code !== 'ENOENT' && err.errno !== -4058) { response = { message: 'Boltz Restore List Failed!', error: err } }
    if (boltzFiles && boltzFiles.length > 0) {
      for(let i=0; i < boltzFiles.length; i++) {
        fs.readFile(common.selectedNode.boltz_swaps_path + common.path_separator + boltzFiles[i], 'utf8', function read(err, data) {
          files_list.push(mapToSwapTableData(JSON.parse(data)));
          if(i === boltzFiles.length-1) callback(files_list);
        });
      }
    }
  });
}

function createBoltzSwap(callback, swap) {
  const swapToWrite = {...swap, initiationTime: new Date().toLocaleString(), lastUpdateTime: new Date().toLocaleString()};
  fs.writeFile(common.selectedNode.boltz_swaps_path + common.path_separator + swapToWrite.id + '.boltz', JSON.stringify(swapToWrite), 'utf8', (err) => {
    if (err) throw err;
    createSwapEventStream(swapToWrite);
    callback([swapToWrite]);
    if(swap.type === 'WITHDRAWAL') {
      sendPayment(swap);
    } else {
      sendCoins(swap);
    }
  });
}

function updateBoltzSwap(swap) {
  const filePath = common.selectedNode.boltz_swaps_path + common.path_separator + swap.id + '.boltz';
  fs.readFile(filePath, 'utf8', function read(err, data) {
    const newSwap = JSON.parse(data);
    newSwap.state = swap.state;
    newSwap.lastUpdateTime = new Date().toLocaleString();
    fs.writeFile(filePath, JSON.stringify(newSwap), 'utf8', (err) => {
      if (err) throw err;
    });
  });
}

function sendPayment(swap) {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channels/transactions';
  options.form = {
    payment_request: swap.invoice,
  };
  if(swap.outgoingChannel) {
    options.form.outgoingChannel = swap.outgoingChannel;
  }
  options.form = JSON.stringify(options.form);
  logger.info({fileName: 'Channels', msg: 'Send Payment Options: ' + options.form});
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Send Payment Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Channels', lineNum: 200, msg: 'Send Payment  Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      updateBoltzSwap({
        id: swap.id,
        state: 'Failed'
      });
    } else if (body.payment_error) {
      logger.error({fileName: 'Channels', lineNum: 206, msg: 'Send Payment Error: ' + JSON.stringify(body.payment_error)});
      updateBoltzSwap({
        id: swap.id,
        state: 'Failed'
      });
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    logger.error({fileName: 'Channels', lineNum: 222, msg: 'Send Payment Error: ' + JSON.stringify(err)});
    updateBoltzSwap({
      id: swap.id,
      state: 'Failed'
    });
  });
}

function sendCoins(swap) {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/transactions';
  options.form = { 
    amount: swap.expectedAmount,
    addr: swap.address
  };
  options.form = JSON.stringify(options.form);
  request.post(options).then((body) => {
    logger.info({fileName: 'Transactions', msg: 'Transaction Post Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Transactions', lineNum: 60, msg: 'Post Transaction Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      updateBoltzSwap({
        id: swap.id,
        state: 'Failed'
      });
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    logger.error({fileName: 'Transactions', lineNum: 76, msg: 'Transaction Post Error: ' + JSON.stringify(err)});
    updateBoltzSwap({
      id: swap.id,
      state: 'Failed'
    });
  });
}

function checkAllSwaps(callback) {
  fs.readdir(common.selectedNode.boltz_swaps_path, function (err, files) {
    if(!files) return;
    const boltzFiles = files.filter(file => file.includes('.boltz'));
    if (err && err.code !== 'ENOENT' && err.errno !== -4058) { response = { message: 'Boltz Restore List Failed!', error: err } }
    if (boltzFiles && boltzFiles.length > 0) {
      for(let i=0; i < boltzFiles.length; i++) {
        fs.readFile(common.selectedNode.boltz_swaps_path + common.path_separator + boltzFiles[i], 'utf8', function read(err, data) {
          const swap = JSON.parse(data);
          if(['Successful', 'Failed'].indexOf(swap.state) === -1) {
            fetchSwapStatus(swap);
          }
        });
      }
    }
  });
}

function fetchSwapStatus(swap) {
  const swapStatusUrl = getBoltzServerUrl() + SWAP_STATUS;
  request({
    method: 'POST',
    url: swapStatusUrl,
    body: {
      id: swap.id
    },
    json: true
  }).then(response => {
    handleSwapStatus(response, swap);
  })
}

function mapToSwapTableData(swap) {
  return {
    type: swap.type,
    htlc_address: swap.address || swap.lockupAddress,
    state: swap.state,
    amt: swap.expectedAmount || swap.onchainAmount,
    id_bytes: swap.id,
    provider: swap.provider,
    cost_server: swap.costServer,
    cost_onchain: swap.costOnchain,
    initiation_time_str: swap.initiationTime.toString(),
    last_update_time_str: swap.lastUpdateTime.toString()
  }
}

function createSwapEventStream(swap) {
    streamMap[swap.id] = {
      stream: new EventSource(`${getBoltzServerUrl()}${STREAM_SWAP_STATUS}?id=${swap.id}`),
      timeoutFn: setTimeout(() => {
        if(streamMap[swap.id]) {
          refundTransaction(swap);
          deleteStreamObj(swap.id);
        }
      }, swapExpiredSec)
    }

    streamMap[swap.id].stream.onerror = () => {
      deleteStreamObj(swap);
      console.log(`Lost connection to Boltz`);
    };
  
    streamMap[swap.id].stream.onmessage = event => {
      handleSwapStatus(JSON.parse(event.data), swap);
    };
}

function handleSwapStatus (data, swap) {
  const status = data.status;
  switch(status) {
    case 'transaction.claimed':
      updateBoltzSwap({
        id: swap.id,
        state: 'Successful'
      });
      if(streamMap[swap.id]) deleteStreamObj(swap.id);
      break;

    case 'transaction.mempool':
      if(swap.fast) {
        if(streamMap[swap.id]) deleteStreamObj(swap.id);
        updateBoltzSwap({
          id: swap.id,
          state: 'Successful'
        });
        claimTransaction(data, swap);
      }
      break;

    case 'transaction.confirmed':
      if(swap.state !== 'Successful') {
        if(streamMap[swap.id]) deleteStreamObj(swap.id);
        updateBoltzSwap({
          id: swap.id,
          state: 'Successful'
        });
        claimTransaction(data, swap);
      }
      break;

    case 'transaction.refunded':
      if(streamMap[swap.id]) deleteStreamObj(swap.id);
      updateBoltzSwap({
        id: swap.id,
        state: 'Failed'
      });
      break;

    case 'swap.expired':
      refundTransaction(swap);
      if(streamMap[swap.id]) deleteStreamObj(swap.id);
      break;

    default:
      if(!streamMap[swap.id]) { createSwapEventStream(swap) }
      break;

  }
}

function deleteStreamObj(swapId) {
  streamMap[swapId].stream.close();
  clearTimeout(streamMap[swapId].timeoutFn);
  delete streamMap[swapId];
}

function refundTransaction(swap) {
  const feeEstimationUrl = getBoltzServerUrl() + GET_FEE_ESTIMATION;
  const getTransactionUrl = getBoltzServerUrl() + GET_SWAP_TRANSACTION;
  const { ECPair, crypto, Transaction, address } = bitcoinjs;
  const { detectSwap, constructRefundTransaction } = boltzCore;
  let feeEstimation = null;
  request({
    method: 'GET',
    url: feeEstimationUrl
  }).then(feeEstimationRes => {
    feeEstimation = JSON.parse(feeEstimationRes);
    return request({
      method: 'POST',
      url: getTransactionUrl,
      body: {
        id: swap.id
      },
      json: true
    });
  }).then(transaction => {
    const {privateKey} = swap;
    const redeemScript = Buffer.from(swap.redeemScript, 'hex');
    const lockupTransaction = Transaction.fromHex(transaction.transactionHex);
    const refundTransaction = constructRefundTransaction(
      [
        {
          ...detectSwap(redeemScript, lockupTransaction),
          redeemScript,
          txHash: lockupTransaction.getHash(),
          keys: ECPair.fromPrivateKey(getHexBuffer(privateKey))
        },
      ],
      address.toOutputScript(swap.address, getNetwork()),
      swap.timeoutBlockHeight,
      feeEstimation[currency]
    ).toHex();
    broadcastTransaction({
      currency: currency,
      transactionHex: refundTransaction
    });
  });
}

function claimTransaction(data, swap) {
  const feeEstimationUrl = getBoltzServerUrl() + GET_FEE_ESTIMATION;
  const { ECPair, crypto, Transaction, address } = bitcoinjs;
  const { detectSwap, constructClaimTransaction } = boltzCore;
  request({
    method: 'GET',
    url: feeEstimationUrl
  }).then(feeEstimationRes => {
    const feeEstimation = JSON.parse(feeEstimationRes);
    const {preimage, privateKey} = swap;
    const redeemScript = Buffer.from(swap.redeemScript, 'hex');
    const lockupTransaction = Transaction.fromHex(data.transaction.hex);
    const claimTransaction = constructClaimTransaction(
      [
        {
          ...detectSwap(redeemScript, lockupTransaction),
          redeemScript,
          txHash: lockupTransaction.getHash(),
          preimage: Buffer.from(preimage, 'hex'),
          keys: ECPair.fromPrivateKey(getHexBuffer(privateKey))
        },
      ],
      address.toOutputScript(swap.newAddress, getNetwork()),
      feeEstimation[currency],
      false
    ).toHex();
    broadcastTransaction({
      currency: currency,
      transactionHex: claimTransaction
    });
  });
}

function broadcastTransaction(body) {
  const broadcastTransactionUrl = getBoltzServerUrl() + BROADCAST_TRANSACTION;
  request({
    method: 'POST',
    url: broadcastTransactionUrl,
    body,
    json: true
  });
}

function getHexBuffer(input) {
  return Buffer.from(input, 'hex');
};

function capitalizeFirstLetter(input) {
  return input.charAt(0).toUpperCase() + input.slice(1);
};

function getNetwork() {
  const { Networks } = boltzCore;
  return Networks[`bitcoin${capitalizeFirstLetter(network)}`];
};

exports.getServerUrl = (req, res, next) => {
  return res.status(200).json(getBoltzServerUrl())
}

exports.getSwapsList = (req, res, next) => {
  getFilesList(getFilesListRes => {
    if (getFilesListRes.error) {
      return res.status(500).json(getFilesListRes);
    } else {
      return res.status(200).json(getFilesListRes);
    }
  });
};

exports.addSwap = (req, res, next) => {
  createBoltzSwap(createBoltzSwapRes => {
    if (createBoltzSwapRes.error) {
      return res.status(500).json(createBoltzSwapRes);
    } else {
      return res.status(200).json(createBoltzSwapRes);
    }
  }, req.body)
}

exports.checkBoltzSwaps = (lndNetwork) => {
  network = lndNetwork;
  checkAllSwaps();
}