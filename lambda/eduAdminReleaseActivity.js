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

function getOrgId(principalId) {
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
  var activity = {
    "ACTIVITY_TITLE": event.activityTitle,
    "ACTIVITY_ID": onlyId,
    "ACTIVITY_PLACE": event.activityPlace,
    "ACTIVITY_TIME": event.activityTime,
    "ACTIVITY_COVER": `${cover}${imgId}1${event.coverType}`,
    "ACTIVITY_CONTENT_IMG": `${cover}${imgId}2${event.imgType}`,
    "PRINCIPAL_ID": event.principalId,
    // "ACTIVITY_PRICE": 0
    "FORM_DETAIL": event.formDetail == null ? "null" : JSON.parse(event.formDetail),
    "VIDEOS": event.videoType === null ? [] : [`${baseURL}${imgId}3${event.videoType}`],
    "ACTIVITY_PRICE": event.activityPrice
  };
  

  getOrgId(event.principalId)
    .then(res => {
      let params = {
        TableName: 'CEDSI_ORG',
        Key: {
          ORG_ID: res.Item.ACCOUNT_ID
        },
        UpdateExpression: "SET ACTIVITIES = list_append(if_not_exists(ACTIVITIES, :empty_object), :activity)",
            ExpressionAttributeValues: {
                ":empty_object": [],
                ":activity": activity
              }
      };
      return insertActivity(params);
    })
    .then(res => {
      return getToken();
    })
    .then(data => {
      data.Credentials.id = imgId;
      response.status = '200 OK';
      response.data = data.Credentials;
      callback(null, response);
    })
    .catch(err => {
      console.error(JSON.stringify(err));
      callback(err, null);
    });
};
