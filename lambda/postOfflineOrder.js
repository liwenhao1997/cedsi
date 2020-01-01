'use strict';
let AWS = require('aws-sdk');
AWS.config = new AWS.Config({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

/**
 *  插入由小程序传递过来的表单
 *
 * @param {Object} event
 * @returns
 */
function insertOfflineOrder(event) {
  let Item = {
    "CREATE_TIME": Date.now(),
    "PAY_STATUS": "SUCCESS",
    "SIGH_STATUS": "NOT_SIGH",
    "OPEN_ID": event.OPEN_ID,
    "ORDER_ID": event.ORDER_ID,
    "FEE": event.FEE,
    "ACTIVITY_ID": event.ACTIVITY_ID,
    "ACTIVITY_NAME": event.ACTIVITY_NAME
  };
  event.FORM = JSON.parse(event.FORM);
  Object.keys(event.FORM).forEach(item => {
    console.log(event.FORM[item]);
    Item[item.toUpperCase()] = event.FORM[item];
  });
  let params = {
    TableName: 'OFFLINE_ACTIVITY_MESSAGE',
    Item: Item
  };
  return new Promise((resolve, reject) => {
    docClient.put(params, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {
  console.log(JSON.stringify((event)));
  insertOfflineOrder(event)
    .then(res => {
      console.log(JSON.stringify(res));
      callback(null, { status: "ok" });
    })
    .catch(err => {
      console.log("ERROR!");
      console.log(JSON.stringify(err));
      callback(err, null);
    });
};