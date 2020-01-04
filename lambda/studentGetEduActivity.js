'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;


function getEduAdminActivity(org_id) {
  let params = {
    TableName: 'CEDSI_ORG',
    Key: {
      ORG_ID: org_id
    },
    ProjectionExpression: "ACTIVITIES"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getORGCode(principalId) {
  let params = {
    TableName: 'CEDSI_STUDENT',
    Key: {
      USER_ID: principalId
    },
    ProjectionExpression: "ORG_ID"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {

  console.log(JSON.stringify(event));

  getORGCode(event.principalId)
    .then(res => {
      return getEduAdminActivity(res.Item.ORG_ID);
    })
    .then(res => {
      callback(null, res.Item.ACTIVITIES);
    })
    .catch(err => {
      console.error(JSON.stringify(err));
      callback(err, null);
    });
};