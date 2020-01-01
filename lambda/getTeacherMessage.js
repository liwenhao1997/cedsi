'use strict';
var AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
var docClient = new AWS.DynamoDB.DocumentClient;

function getMessageListPromise(teacherId) {
  let params = {
    TableName: "CEDSI_TEACHER_MESSAGE",
    IndexName: 'TEACHER_ID',
    KeyConditionExpression: 'TEACHER_ID = :id',
    ExpressionAttributeValues: { ':id': teacherId }
  };
  
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      if (err) {
        console.log(JSON.stringify(err));
        reject(err);
      } else {        
        data ? resolve(data) : reject("Empty Teacher List");
      }
    });
  });
}

exports.handler = (event, context, callback) => {
  var response = {};
  console.log(JSON.stringify(event));
  if (event.role !== '2') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }

  getMessageListPromise(event.principalId).then(result => {
    console.log(JSON.stringify(result));
    result.Items.forEach(item => { delete item.TEACHER_ID });
    callback(null, result.Items);
  });
};
