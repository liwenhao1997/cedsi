'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

function getAnActivity(org_id, activityId) {
  let params = {
    TableName: "CEDSI_ORG",
    Key: {
      ORG_ID: org_id
    },
    ProjectionExpression: "ACTIVITIES"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        data.Item.ACTIVITIES.forEach(item => {
          if (item.ACTIVITY_ID == activityId) {
            resolve(item);
          }
        })
    }
    });
  });
}
function getAccountCode(id) {
  var params = {
      TableName: 'AUTH_USER',
      Key: {
          USER_ID: id
      },
      ProjectionExpression: "ACCOUNT_ID"
  };
  return new Promise((resolve, reject) => {
      docClient.get(params, function (err, data) {
          if (err) {
              reject(err);
          } else {
              resolve(data.Item);
          }
      });
  });
}
exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  let data = {};
  getAccountCode(event.principalId).then(org_id => {
    getAnActivity(org_id, event.id)
    .then(res => {
      data = res.Item;
      delete data.PRINCIPAL_ID;
      callback(null, data);
    })
    .catch(err => {
      console.error(JSON.stringify(err));
    });
  })
};