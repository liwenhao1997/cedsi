'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

function getSignUpInformation(event) {
  let params = {
    TableName: 'OFFLINE_ACTIVITY_MESSAGE',
    IndexName: 'ACTIVITY_ID',
    KeyConditionExpression: 'ACTIVITY_ID = :id',
    ExpressionAttributeValues: {
      ':id': event.activityId
    }
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  let response = {};
  if (event.role !== '4') {
    response.status = "fail";
    response.err = "非法访问";
    callback(response, null);
  }

  getSignUpInformation(event)
    .then(res => {
      console.log(JSON.stringify(res));
      let result = res.Items;
      result.sort((a, b) => a.CREATE_TIME - b.CREATE_TIME);
      console.log(result);
      callback(null, result);
    })
    .catch(err => {
      console.log("ERROR!");
      console.log(JSON.stringify(err));
      callback(err, null);
    });
};