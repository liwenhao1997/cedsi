'use strict';
var AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
var docClient = new AWS.DynamoDB.DocumentClient;

function updateHomeworkRemark(params) {
  return new Promise((resolve, reject) => {
    docClient.update(params, function (err, data) {
      err ? reject(err) : resolve(data); 
    });
  });
}

exports.handler = (event, context, callback) => {
  let response = {};
  let params = {
    TableName: 'CEDSI_STUDENT_HOMEWORK',
    Key: { HW_ID: event.homeworkId },
    UpdateExpression: 'set #R = :R, #K = :K, #S = :S',
    ExpressionAttributeNames: { '#R': 'TEACHER_REMARK', '#K': 'HW_RANK', '#S': 'SELECTED_WORKS' },
    ExpressionAttributeValues: {
      ':R': event.teacherRemark,
      ':K': event.homeworkRank,
      ':S': event.selectedWork
    }
  };
  
  console.log(JSON.stringify(event));
  if (event.role != '2') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }

  updateHomeworkRemark(params)
    .then(res => {
      console.log(JSON.stringify(res));
      callback(null, { status: 200 });
    })
    .catch(err => {
      callback(err, null);
      console.log(JSON.stringify(err));
    });
};