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
function getIndex(teacherId, workId) {
  var params = {
      TableName: "CEDSI_TEACHER",
      Key: {
        TEACHER_ID: teacherId
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
                  if (element.HOMEWORK_ID == workId) {
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
  if (event.role != "2") {
    response.status = "fail";
    response.err = "非法访问";
    callback(response, null);
    return;
  }

  getIndex(event.principalId, event.HW_ID).then(index => {
    let params = {
      TableName: 'CEDSI_TEACHER',
      Key: {
        'TEACHER_ID': event.principalId
      },
      UpdateExpression: 'set HOMEWORKS[:index]DEADLINE = :B, HOMEWORKS[:index]CLASS_ID = :C, HOMEWORKS[:index]COURSE_ID = :D, HOMEWORKS[:index]CP_ID = :E, HOMEWORKS[:index]CONTENT = :F, HOMEWORKS[:index].HW_NAME = :G',
      ExpressionAttributeValues: {
        ':B': event.DEADLINE,
        ':C': event.CLASS_ID,
        ':D': event.COURSE_ID,
        ':E': event.CP_ID,
        ':F': event.CONTENT,
        ':G': event.HW_NAME,
        ":index": index
      }
    };
    updateHomework(params)
      .then(() => {
        callback(null, { status: "ok" });
      })
      .catch(err => {
        console.error(JSON.stringify(err));
        callback(err, null);
      });
  })
};