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
              console.log(JSON.stringify(err));
              reject("err1");
          } else {
            resolve(data.Item);
          }
      });
  });
}
function insertActivity(event, baseURL, onlyId, imgId) {
  var activity = {
    "ACTIVITY_TITLE": event.activityTitle,
    "ACTIVITY_ID": onlyId,
    "ACTIVITY_PLACE": event.activityPlace,
    "ACTIVITY_TIME": event.activityTime,
    "ACTIVITY_COVER": `${baseURL}${imgId}1${event.coverType}`,
    "ACTIVITY_CONTENT_IMG": `${baseURL}${imgId}2${event.imgType}`,
    "PRINCIPAL_ID": event.principalId,
    "ACTIVITY_PRICE": event.activityPrice,
    "FORM_DETAIL": JSON.parse(event.formDetail),
    "VIDEOS": event.videoType === "null" ? [] : [`${baseURL}${imgId}3${event.videoType}`]
  }
  let params = {
    TableName: 'CEDSI_ORG',
    IndexName: "ORG_CODE",
    KeyConditionExpression: "ORG_CODE = :code",
    ExpressionAttributeValues: {
      ":code": orgCode
  }
  };
  return new Promise((resolve, reject) => {
    docClient.put(params, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {
  let response = {};
  console.log(JSON.stringify(event));
  if (event.role != '4') {
    response.status = 'error';
    response.err = "非法访问!";
    callback(response, null);
  }

  let onlyId = uuid.v4();
  let imgId = onlyId.substring(0, 8);
  let baseURL = "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/activity/";

  insertActivity(event, baseURL, onlyId, imgId)
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