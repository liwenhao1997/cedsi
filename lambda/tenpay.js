'use strict';
let axios = require("axios");
let AWS = require('aws-sdk');
let x2js = require("x2js");
let convert = new x2js();
let random = require("string-random");
let MD5 = require("md5");
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

/**
 * 获取 Lambda 的动态 IP
 *
 * @returns
 */
function getLambdaExportIP() {
  return new Promise((resolve, reject) => {
    axios.get("http://checkip.amazonaws.com/")
      .then(res => { resolve(res.data) })
      .catch(err => { reject(err) });
  });
}

/**
 *  插入数据库预订单
 *
 * @param {Object} event
 * @returns
 */
function putPreOrder(event) {
  let params = {
    TableName: "STUDENT_ORDER",
    Item: {
      ORDER_ID: event.orderId,
      PAY_STATUS: "ONPAYING",
      COMMIT_TIME: Date.now().toString(),
      FEE: event.fee,
      PRODUCT_NAME: event.productName,
      USER_ID: event.principalId,
      OPEN_ID: event.openid ? event.openid : "null"
    }
  };
  if (!params.Item.ORDER_ID) {
    delete params.Item.ORDER_ID;
  }
  return new Promise((resolve, reject) => {
    docClient.put(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

/**
 * 获取统一支付订单
 *
 * @param {Object} event
 * @returns
 */
function getUnifiedOrder(event) {
  let params = {
    "appid": event.appid,
    "body": "赛迪思网页-课程购买",
    "detail": "该笔订单用于购买赛迪思人工智能课程",
    "device_info": "WEB",
    "mch_id": event.mchId,
    "nonce_str": random(32),
    "notify_url": event.notifyUrl,
    "out_trade_no": event.orderId,
    "product_id": event.productId,
    "sign_type": "MD5",
    "spbill_create_ip": event.ip,
    "total_fee": Number.parseFloat(event.fee/100),
    "trade_type": "NATIVE",
  };
  params.sign = sign(params, event.key);
  return new Promise((resolve, reject) => {
    let data = convert.js2xml({ xml: params });
    axios.post("https://api.mch.weixin.qq.com/pay/unifiedorder", data)
      .then(res => { resolve(res.data) })
      .catch(err => { reject(err) });
  });
}

/**
 * 签名算法
 *
 * @param {Object} params
 * @returns
 */
function sign(params, key) {
  let result = Object.keys(params).sort();
  let len = result.length;
  let stringA = result.reduce((temp, item, index) => {
    if (!params[item]) { return temp }
    return temp += `${item}=${params[item]}${index === len ? '' : '&'}`;
  }, "");
  return MD5(`${stringA}key=${key}`).toUpperCase();
}

exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  event.mchId = "1555021781";
  event.appid = "wx743c207a32f8e614";
  event.key = "8c15569393c7f7120680b42cb0ecfd9a";
  event.notifyUrl = "https://3z8miabr93.execute-api.cn-northwest-1.amazonaws.com.cn/prod/lambda/tenpay/";


  getLambdaExportIP()
    .then(res => {
      console.log(res);
      event.ip = res;
      return putPreOrder(event);
    })
    .then(res => {
      console.log(res);
      return getUnifiedOrder(event);
    })
    .then(res => {
      console.log(res);
      let data = convert.xml2js(res);
      callback(null, data.xml);
    })
    .catch(err => {
      console.log(err);
      callback(err, null);
    });
};