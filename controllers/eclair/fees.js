var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getFees = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/audit';
  tillToday = Math.floor(Date.now() / 1000);
  fromLastMonth = tillToday - (86400 * 30);
  options.qs.from = fromLastMonth;
  options.qs.to = tillToday;
  request.post(options).then((body) => {
      body = {
        "sent":[
          {
            "type": "payment-sent",
            "id": "c85d70da-d159-4a36-938a-c3d2f967f730",
            "paymentHash": "836c8795e811fe0306fb4fee3ee3d0c5a2529dd4ac90d6aca4bd5faf26790a93",
            "paymentPreimage": "62d6f7517b5066c348cddc0a31ee1ed5e8929de2dbe1c7a24bcb5c7cd0a047e4",
            "recipientAmount": 100000,
            "recipientNodeId": "03d41301628a6086aa7a46a2810e73cc1dcdaf4678ea2b3e805befd3b76af31512",
            "parts": [
              {
                "id": "4e8f2440-dbfd-4e76-bb45-a0647a966b2a",
                "amount": 40000,
                "feesPaid": 50,
                "toChannelId": "abab001395fe3e94f58712d65065f362f42e670c45b9e284398866139d98f379",
                "timestamp": 1569337871061
              },
              {
                "id": "63e9b037-92d6-4f3d-b484-41740fc278f5",
                "amount": 60000,
                "feesPaid": 10,
                "toChannelId": "abab001395fe3e94f58712d65065f362f42e670c45b9e284398866139d98f379",
                "timestamp": 1569337871061
              }
            ]
          }
        ],
        "received":[
        {
          "type": "payment-received",
          "paymentHash": "5271e28256bf0511921a11fc15984b260937f4bf42e85bac31bc4da7a89c6bc3",
          "parts": [
            {
              "amount": 1000,
              "fromChannelId": "abab001395fe3e94f58712d65065f362f42e670c45b9e284398866139d98f379",
              "timestamp": 1569338275801
            },
            {
              "amount": 1500,
              "fromChannelId": "8ca125b6ae86c44021337c273bd620e88263d4769de35cccded3cdcb9d1cdcc4",
              "timestamp": 1569338275803
            }
          ]
        }
      ],
      "relayed":[
        {
            "type": "payment-relayed",
            "amountIn":150001,
            "amountOut":150000,
            "paymentHash":"427309c52a46f8c005ad840c106fcdc9c4c60f95769525bc91c4a742133e4fe3",
            "fromChannelId":"56d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0e",
            "toChannelId":"56d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0e",
            "timestamp":1591446188
        },
        {
          "type": "payment-relayed",
          "amountIn":250003,
          "amountOut":250000,
          "paymentHash":"427309c52a46f8c005ad840c106fcdc9c4c60f95769525bc91c4a742133e4fe3",
          "fromChannelId":"56d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0e",
          "toChannelId":"56d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0e",
          "timestamp":1591791788
        },
        {
          "type": "payment-relayed",
          "amountIn":200005,
          "amountOut":200000,
          "paymentHash":"427309c52a46f8c005ad840c106fcdc9c4c60f95769525bc91c4a742133e4fe3",
          "fromChannelId":"56d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0e",
          "toChannelId":"56d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0e",
          "timestamp":1592310188
        }
      ]
    };
    body.daily_fee = 0;
    body.daily_txs = 0;
    body.weekly_fee = 0;
    body.weekly_txs = 0;
    body.monthly_fee = 0;
    body.monthly_txs = 0;
    let current_time = Math.round((new Date().getTime()) / 1000);
    let month_start_time = current_time - 2629743;
    let week_start_time = current_time - 604800;
    let day_start_time = current_time - 86400;
    let fee = 0;
    body.relayed.forEach(relayedEle => {
      logger.info({fileName: 'Fees', msg: 'Relayed Transaction: ' + JSON.stringify(relayedEle)});
      fee = relayedEle.amountIn - relayedEle.amountOut;
      if (relayedEle.timestamp >= day_start_time) {
        body.daily_fee = body.daily_fee + fee;
        body.daily_txs = body.daily_txs + 1;
      }
      if (relayedEle.timestamp >= week_start_time) {
        body.weekly_fee = body.weekly_fee + fee;
        body.weekly_txs = body.weekly_txs + 1;
      }
      if (relayedEle.timestamp >= month_start_time) {
        body.monthly_fee = body.monthly_fee + fee;
        body.monthly_txs = body.monthly_txs + 1;
      }
    });
    logger.info({fileName: 'Fees', msg: JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Fees', lineNum: 57, msg: 'Get Fees Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Fetching Fees failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};
