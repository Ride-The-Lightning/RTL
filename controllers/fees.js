var request = require('request');
var options = require("../connect");
var common = require('../common');

exports.getFees = (req, res, next) => {
  // setTimeout(()=>{res.status(201).json({"fees":{"channel_fees":[{"chan_point":"a75eabb7386e977210a9796032f5bc3c793b474630ca373669f3c09d0fa095a5:0","base_fee_msat":"1000","fee_per_mil":"1","fee_rate":0.000001},{"chan_point":"acda63cdb77c5feffa41342e376968865bc1578f9e13a04d6b5d02af60f21425:0","base_fee_msat":"1000","fee_per_mil":"1","fee_rate":0.000001},{"chan_point":"3d387f17ee1937faf93b9355d9b351dd9227a424b3c3f0ae4120b275957fef1c:0","base_fee_msat":"1000","fee_per_mil":"1","fee_rate":0.000001},{"chan_point":"d437c5c67aabcb9e8ca36ffd3458068edb20bd15bba7cae60a99cdfa5ac71d3c:0","base_fee_msat":"1000","fee_per_mil":"1","fee_rate":0.000001},{"chan_point":"e799a7e18f99398c9849391947bbbce46b14b651181dac57bfcbb7705796ce52:0","base_fee_msat":"1000","fee_per_mil":"1","fee_rate":0.000001},{"chan_point":"aefc7a8269998ad5617a2e4fb5fa40c7f6716ca5e09b065f50b80473624a0b8b:0","base_fee_msat":"1000","fee_per_mil":"1","fee_rate":0.000001}],"day_fee_sum":0,"week_fee_sum":0,"month_fee_sum":0}});}, 5000);
  options.url = common.lnd_server_url + '/fees';
  request.get(options, (error, response, body) => {
    console.log("Fee Received: " + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching fee failed!",
        error: (undefined === body) ? 'ERROR From Server!' : body.error
      });
    } else {
      if (undefined === body.day_fee_sum) {
        body.day_fee_sum = 0;
      }
      if (undefined === body.week_fee_sum) {
        body.week_fee_sum = 0;
      }
      if (undefined === body.month_fee_sum) {
        body.month_fee_sum = 0;
      }
      res.status(200).json(body);
    }
  });
};
