'use strict';
var AWS = require('aws-sdk');
var uuid = require('uuid');
AWS.config.update({ region: 'cn-northwest-1' });
var docClient = new AWS.DynamoDB.DocumentClient;

function getTeacherHomework(messageId) {
  let params = {
    TableName: "CEDSI_TEACHER_HOMEWORK",
    Key: { HOMEWORK_ID: messageId }
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getCourseName(classId) {
  let params = {
    TableName: 'CEDSI_CLASS',
    Key: { CLASS_ID: classId },
    ProjectionExpression: "COURSE_NAME"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getChapterName(CP_ID) {
  let params = {
    TableName: 'CEDSI_CHAPTERS',
    Key: { CP_ID: CP_ID },
    ProjectionExpression: "CP_NAME"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getProperStudent(classId) {
  let params = {
    TableName: 'CEDSI_STUDENT',
    IndexName: 'CLASS_ID',
    KeyConditionExpression: 'CLASS_ID = :id',
    ExpressionAttributeValues: { ':id': classId }
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function insertMessage(users, homework) {
  let params = { RequestItems: { 'CEDSI_STUDENT_MESSAGE': [] } };
  let now = Date.now().toString();
  params.RequestItems.CEDSI_STUDENT_MESSAGE = users.map(user => {
    return {
      PutRequest: {
        Item: {
          MESSAGE_ID: uuid.v4(),
          DISPATCH_DATE: now,
          DISPATCH_ID: homework.WHO_POST,
          MESSAGE_CONTENT: homework.CONTENT,
          MESSAGE_STATUS: true,
          MESSAGE_TYPE: "5",
          RECIPIENT_ID: user,
          COURSE_NAME: homework.COURSE_NAME,
          CP_NAME: homework.CP_NAME,
          HW_NAME: homework.HW_NAME,
          DEADLINE: homework.DEADLINE,
          ATTACHED_FILE: homework.ATTACHED_FILE
        }
      }
    };
  });
  return new Promise((resolve, reject) => {
    docClient.batchWrite(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}
exports.handler = (event, context, callback) => {
  let response = {};
  let homework = {};

  console.log(JSON.stringify(event));
  if (event.role != '2') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }

  getTeacherHomework(event.homework_id)
    .then(res => {
      homework = res.Item;
      return getCourseName(homework.CLASS_ID);
    })
    .then(res => {
      homework.COURSE_NAME = res.Item.COURSE_NAME;
      return getChapterName(homework.CP_ID);
    })
    .then(res => {
      homework.CP_NAME = res.Item.CP_NAME;
      return getProperStudent(homework.CLASS_ID);
    })
    .then(res => {
      console.log(JSON.stringify(res));
      let users = res.Items.map(item => item.USER_ID);
      console.log(JSON.stringify(users));
      return insertMessage(users, homework);
    })
    .then(res => {
      console.log(JSON.stringify(res));
      callback(null, { status: 200 });
    })
    .catch(err => {
      console.log(JSON.stringify(err));
      callback(err, null);
    });
};