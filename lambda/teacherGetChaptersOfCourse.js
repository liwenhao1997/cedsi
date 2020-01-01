'use strict';
var AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
var docClient = new AWS.DynamoDB.DocumentClient;

function getChapterNames(courseId) {
  let params = {
    TableName: "CEDSI_CHAPTERS",
    IndexName: 'COURSE_ID',
    KeyConditionExpression: 'COURSE_ID=:id',
    ExpressionAttributeValues: { ':id': courseId },
    ProjectionExpression: "CP_ID,CP_NAME"
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}


exports.handler = (event, context, callback) => {
  var response = {};

  console.log(JSON.stringify(event));
  if (event.role != '2') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }

  getChapterNames(event.course_id)
    .then(res => {
      console.log(JSON.stringify(res));
      callback(null, res.Items);
    })
    .catch(err => {
      console.log(JSON.stringify(err));
      callback(err, null);
    });
};