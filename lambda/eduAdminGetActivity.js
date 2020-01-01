'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;


function getEduAdminActivity(ORG_CODE) {
  let params = {
    TableName: 'CEDSI_EDUADMIN_ACTIVITY',
    IndexName: 'ORG_CODE',
    KeyConditionExpression: 'ORG_CODE = :A',
    ExpressionAttributeValues: {
      ':A': ORG_CODE
    }
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getORGCode(principalId) {
  let params = {
    TableName: 'AUTH_USER',
    Key: { USER_ID: principalId },
    ProjectionExpression: "ACCOUNT_ID"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {

  console.log(JSON.stringify(event));
  let response = {};
  // if (event.role !== "3") {
  //   response.status = "fail";
  //   response.err = "非法访问";
  //   callback(response, null);
  //   return;
  // }

  getORGCode(event.principalId)
    .then(res => {
      console.log(res.Item.ACCOUNT_ID);
      return getEduAdminActivity(res.Item.ACCOUNT_ID);
    })
    .then(res => {
      console.log(res.Items);
      callback(null, res.Items);
    })
    .catch(err => {
      console.log(JSON.stringify(err));
    });
};