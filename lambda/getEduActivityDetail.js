'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

function getAnActivity(activityId) {
  let params = {
    TableName: "CEDSI_EDUADMIN_ACTIVITY",
    Key: { ACTIVITY_ID: activityId }
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  let data = {};
  getAnActivity(event.id)
    .then(res => {
      console.log(JSON.stringify(res));
      data = res.Item;
      delete data.PRINCIPAL_ID;
      callback(null, data);
    })
    .catch(err => {
      console.error("Error!");
      console.log(JSON.stringify(err));
    });
};