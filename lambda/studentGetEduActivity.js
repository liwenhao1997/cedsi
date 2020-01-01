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
    TableName: 'CEDSI_STUDENT',
    KeyConditionExpression: 'USER_ID = :id',
    ExpressionAttributeValues: {
      ':id': principalId
    },
    ProjectionExpression: "ORG_ID"
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {

  console.log(JSON.stringify(event));

  getORGCode(event.principalId)
    .then(res => {
      console.log(res);
      return getEduAdminActivity(res.Items[0].ORG_ID);
    })
    .then(res => {
      console.log(res.Items);
      callback(null, res.Items);
    })
    .catch(err => {
      console.log(JSON.stringify(err));
      callback(err, null);
    });
};