'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let x2js = require("x2js");
let convert = new x2js();
const MD5 = require("md5");
const random = require("string-random");
const axios = require("axios");
const weiXinAPI = "https://api.mch.weixin.qq.com/pay/orderquery";
const mch_id = "1555021781";
const appid = "wx743c207a32f8e614";
const key = "8c15569393c7f7120680b42cb0ecfd9a";

let docClient = new AWS.DynamoDB.DocumentClient;

/**
 * 查询微信的订单状态
 *
 * @param {String} orderId
 * @returns
 */
function orderQuery(orderId) {
  let params = {
    appid: appid,
    mch_id: mch_id,
    out_trade_no: orderId,
    nonce_str: random(32),
    sign_type: "MD5"
  };
  params.sign = sign(params, key);
  return new Promise((resolve, reject) => {
    let data = convert.js2xml({ xml: params });
    axios.post(weiXinAPI, data)
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

/**
 * 更改数据库支付订单信息
 *
 * @returns
 */
function updateOrderStatus(orderId) {
  let params = {
    TableName: "STUDENT_ORDER",
    Key: { ORDER_ID: orderId },
    UpdateExpression: 'set PAY_STATUS = :R',
    ExpressionAttributeValues: { ':R': "SUCCESS" }
  };
  return new Promise((resolve, reject) => {
    docClient.update(params, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = async event => {
  let res = await orderQuery(event.orderId);
  let { xml } = convert.xml2js(res);
  console.log(xml);
  let isReturnCodeRight = xml.return_code === "SUCCESS";
  let isResultCodeRight = xml.result_code === "SUCCESS";
  let isTradeStateRight = xml.trade_state === "SUCCESS";
  if (isReturnCodeRight && isResultCodeRight && isTradeStateRight) {
    await updateOrderStatus(event.orderId);
    return "SUCCESS";
  }
  return "FAIL";
};