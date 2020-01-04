'use strict';
var AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
var docClient = new AWS.DynamoDB.DocumentClient;

function getChapterNames(courseId) {
  let params = {
    TableName: "CEDSI_CURRICULUMS",
    Key: {
      ID: courseId
    },
    ProjectionExpression: "CHAPTERS"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
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
      callback(null, res.Item.CHAPTERS);
    })
    .catch(err => {
      console.error(JSON.stringify(err));
      callback(err, null);
    });
};