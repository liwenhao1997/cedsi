'use strict';
let AWS = require('aws-sdk');
let uuid = require('uuid');
let sts = new AWS.STS();
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

function getToken() {
  let params = {
    DurationSeconds: 3600,
    Policy: "{\"Version\": \"2012-10-17\",\"Statement\": [{\"Sid\": \"VisualEditor0\",\"Effect\": \"Allow\",\"Action\": [\"s3:PutObject\",\"s3:PutBucketTagging\",\"s3:PutBucketAcl\",\"s3:PutBucketPolicy\",\"s3:PutObjectTagging\",\"s3:PutObjectAcl\"],\"Resource\": \"*\"}]}",
    RoleArn: "arn:aws-cn:iam::202976975702:role/IamSTSFullAccess",
    RoleSessionName: "Bob"
  };
  return new Promise((resolve, reject) => {
    sts.assumeRole(params, function (err, data) {
      if (err) reject(err, err.stack); // an error occurred
      else resolve(data);
    });
  });
}

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

function insertActivity(params) {
  return new Promise((resolve, reject) => {
    docClient.put(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {
  let response = {};
  console.log(JSON.stringify(event));
  if (event.role !== '3') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }

  let onlyId = uuid.v4();
  let imgId = onlyId.substring(0, 8);
  let cover = "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/eduActivity/";
  let params = {
    TableName: 'CEDSI_EDUADMIN_ACTIVITY',
    Item: {
      "ACTIVITY_TITLE": event.activityTitle,
      "ACTIVITY_ID": onlyId,
      "ACTIVITY_PLACE": event.activityPlace,
      "ACTIVITY_TIME": event.activityTime,
      "ACTIVITY_COVER": `${cover}${imgId}1${event.coverType}`,
      "ACTIVITY_CONTENT_IMG": `${cover}${imgId}2${event.imgType}`,
      "PRINCIPAL_ID": event.principalId,
      "ACTIVITY_PRICE": 0
      // "ACTIVITY_PRICE": event.activityPrice
    }
  };

  getORGCode(event.principalId)
    .then(res => {
      params.Item.ORG_CODE = res.Item.ACCOUNT_ID || "null";
      return insertActivity(params);
    })
    .then(res => {
      console.log(res);
      return getToken();
    })
    .then(data => {
      console.log(JSON.stringify(data));
      data.Credentials.id = imgId;
      response.status = '200 OK';
      response.data = data.Credentials;
      callback(null, response);
    })
    .catch(err => {
      console.log("ERROR!");
      console.log(JSON.stringify(err));
      callback(err, null);
    });
};
