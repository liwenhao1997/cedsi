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

function getIndex(userId, workId) {
  var params = {
    TableName: "CEDSI_STUDENT",
    Key: {
      USER_ID: userId
    },
    ProjectionExpression: "HOMEWORKS"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      if (err) {
        console.error(JSON.stringify(err));
        reject(err);
      } else {
        var index = 0;
        data.Item.HOMEWORKS.forEach(element => {
          if (element.HW_ID == workId) {
            resolve(index);
          }
          index++;
        });
      }
    });
  })
}
exports.handler = (event, context, callback) => {
  let response = {};
  if (event.role != '2') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }
  
  getIndex(event.principalId, event.homeworkId).then(index => {
    let params = {
      TableName: 'CEDSI_STUDENT',
      Key: {
        USER_ID: event.principalId
      },
      UpdateExpression: 'set HOMEWORKS[:index].TEACHER_REMARK = :R, HOMEWORKS[:index].HW_RANK = :K, HOMEWORKS[:index].SELECTED_WORKS = :S',
      ExpressionAttributeValues: {
        ':R': event.teacherRemark,
        ':K': event.homeworkRank,
        ':S': event.selectedWork,
        ":index": index
      }
    };
  
    updateHomeworkRemark(params)
      .then(() => {
        callback(null, { status: "ok" });
      })
      .catch(err => {
        callback(err, null);
        console.error(JSON.stringify(err));
      });
  })
};