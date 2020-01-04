'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

function getAnActivity(activityId) {
  let params = {
    TableName: "CEDSI_ACTIVITY",
    Key: { ID: activityId }
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

// function getPrincipalAvatar(principalId) {
//   let params = {
//     TableName: "USER_INFO",
//     Key: { USER_ID: principalId },
//     ProjectionExpression: "AVATAR"
//   };
//   return new Promise((resolve, reject) => {
//     docClient.get(params, function (err, data) {
//       err ? reject(err) : resolve(data);
//     });
//   });
// }

exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  let data = {};
  getAnActivity(event.activityId)
    .then(res => {
      console.log(JSON.stringify(res));
      data = res.Item;
      delete data.PRINCIPAL_ID;
      callback(null, data);
    })
    .catch(err => {
      console.log("Error!");
      console.log(JSON.stringify(err));
    });
};