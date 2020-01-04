'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

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

function getProperTeachers(org_id) {
  let params = {
    TableName: "CEDSI_TEACHER",
    IndexName: "ORG_CODE",
    KeyConditionExpression: "ORG_CODE = :id",
    ExpressionAttributeValues: {
      ':id': org_id
    },
    ProjectionExpression: "TEACHER_ID, TEACHER_NAME",
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));

  let response = {};
  if ((event.role !== "3") && (event.role !== "4")) {
    response.status = "fail";
    response.err = "非法访问";
    callback(response, null);
    return;
  }

  getORGCode(event.principalId)
    .then(res => {
      return getProperTeachers(res.Item.ACCOUNT_ID);
    })
    .then(res => {
      callback(null, res.Items);
    })
    .catch(err => {
      console.error(JSON.stringify(err));
      callback(err, null);
    });
};