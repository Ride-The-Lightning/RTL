var request = require('request-promise');
var fs = require('fs');
var common = require('../../common');
var logger = require('../logger');
var EventSource = require('eventsource');
var options = {};
var bitcoinjs = require('bitcoinjs-lib');
var boltzCore = require('boltz-core');
var streamMap = {};
const BOLTZ_API_URL = 'https://testnet.boltz.exchange/api/';
const SWAP_STATUS = 'swapstatus';
const STREAM_SWAP_STATUS = 'streamswapstatus';
const GET_FEE_ESTIMATION = 'getfeeestimation';
const GET_SWAP_TRANSACTION = 'getswaptransaction';
const BROADCAST_TRANSACTION = 'broadcasttransaction';
const currency = 'BTC';
const network = 'testnet';
const swapExpiredSec = 86400000; // one day


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

function checkAllSwaps(callback) {
  fs.readdir(common.selectedNode.boltz_swaps_path, function (err, files) {
    const boltzFiles = files.filter(file => file.includes('.boltz'));
    if (err && err.code !== 'ENOENT' && err.errno !== -4058) { response = { message: 'Boltz Restore List Failed!', error: err } }
    if (boltzFiles && boltzFiles.length > 0) {
      for(let i=0; i < boltzFiles.length; i++) {
        fs.readFile(common.selectedNode.boltz_swaps_path + common.path_separator + boltzFiles[i], 'utf8', function read(err, data) {
          const swap = JSON.parse(data);
          console.log('state', swap.state);
          if(swap.state !== 'Successful' && swap.state !== 'Invoice Settled') {
            fetchSwapStatus(swap);
          }
        });
      }
    }
  });
}

function fetchSwapStatus(swap) {
  console.log('fetching', swap);
  const swapStatusUrl = BOLTZ_API_URL + SWAP_STATUS;
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
      stream: new EventSource(`${BOLTZ_API_URL}${STREAM_SWAP_STATUS}?id=${swap.id}`),
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
        state: 'Invoice Settled'
      });
      if(streamMap[swap.id]) deleteStreamObj(swap.id);
      break;

    case 'transaction.confirmed':
      if(streamMap[swap.id]) deleteStreamObj(swap.id);
      updateBoltzSwap({
        id: swap.id,
        state: 'Successful'
      });
      claimTransaction(data, swap);
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
  const feeEstimationUrl = BOLTZ_API_URL + GET_FEE_ESTIMATION;
  const getTransactionUrl = BOLTZ_API_URL + GET_SWAP_TRANSACTION;
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
  const feeEstimationUrl = BOLTZ_API_URL + GET_FEE_ESTIMATION;
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
  const broadcastTransactionUrl = BOLTZ_API_URL + BROADCAST_TRANSACTION;
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

exports.checkBoltzSwaps = () => {
  console.log('check');
  checkAllSwaps();
}