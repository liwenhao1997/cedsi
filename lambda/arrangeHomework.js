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

function arrangeHomeworkPromise(event) {
  let baseURL = "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn";
  var homework = {
    HOMEWORK_ID: event.ONLY_ID,
    CLASS_ID: event.CLASS_ID,
    COURSE_ID: event.COURSE_ID,
    CONTENT: `${baseURL}/content/${event.ONLY_ID}${event.CONTENT_TYPE}`,
    CP_ID: event.CP_ID,
    DEADLINE: event.DEADLINE,
    HW_NAME: event.HW_NAME,
    ATTACHED_FILE: `/preHomework/attachedFile/${event.ONLY_ID}${event.FILE_TYPE}`
  };
  let params = {
    TableName: "CEDSI_TEACHER",
    Key: {
      TEACHER_ID: event.principalId
    },
    UpdateExpression: "SET HOMEWORKS = list_append(if_not_exists(HOMEWORKS, :empty_object), :homework)",
    ExpressionAttributeValues: {
      ":empty_object": [],
      ":homework": homework
    }
  };
  return new Promise((resolve, reject) => {
    docClient.put(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {
  let response = {};
  event.ONLY_ID = uuid.v4();
  console.log(JSON.stringify(event));

  if (event.role != '2') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }

  arrangeHomeworkPromise(event)
    .then(res => {
      console.log(JSON.stringify(res));
      return getToken();
    })
    .then(data => {
      data.Credentials.id = event.ONLY_ID;
      response.status = 200;
      response.data = data.Credentials;
      callback(null, response);
    })
    .catch(err => {
      console.error(JSON.stringify(err));
    });
};