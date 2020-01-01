'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;


function updateHomework(params) {
  return new Promise((resolve, reject) => {
    docClient.update(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {

  let response = {};
  if (event.role != "2") {
    response.status = "fail";
    response.err = "非法访问";
    callback(response, null);
    return;
  }

  let params = {
    TableName: 'CEDSI_TEACHER_HOMEWORK',
    Key: { 'HOMEWORK_ID': event.HW_ID},
    UpdateExpression: 'set #b = :B, #c = :C, #d = :D, #e = :E, #f = :F, #g = :G',
    ExpressionAttributeNames: {
      '#b': 'DEADLINE',
      '#c': 'CLASS_ID',
      '#d': 'COURSE_ID',
      '#e': 'CP_ID',
      '#f': 'CONTENT',
      '#g': 'HW_NAME',
    },
    ExpressionAttributeValues: {
      ':B': event.DEADLINE,
      ':C': event.CLASS_ID,
      ':D': event.COURSE_ID,
      ':E': event.CP_ID,
      ':F': event.CONTENT,
      ':G': event.HW_NAME,
    }
  };
  updateHomework(params)
    .then(res => {
      console.log(JSON.stringify(res));
      callback(null, { status: 200 });
    })
    .catch(err => {
      console.log(JSON.stringify(err));
    });
};