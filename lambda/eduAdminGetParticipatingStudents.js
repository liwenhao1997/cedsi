'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

function getProperStudents(activityId) {
  let params = {
    TableName: 'CEDSI_STUDENT_ACTIVITY',
    KeyConditionExpression: 'ACTIVITY_ID = :D',
    ExpressionAttributeValues: { ':D': activityId }
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getStudentInfo(userId) {
  let params = {
    TableName: 'CEDSI_STUDENT',
    KeyConditionExpression: 'USER_ID = :D',
    ExpressionAttributeValues: { ':D': userId },
    Limit: 1
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getAttributes(items) {
  let promises = items.map(item => {
    return getStudentInfo(item.USER_ID);
  });
  return Promise.all(promises);
}

function addAttributes(items, result) {
  let mapper = new Map(items.map(item => { return [item.Items[0].USER_ID, item.Items[0]] } ));
  result.forEach(item => {
    let info = mapper.get(item.USER_ID);
    item.STUDENT_NAME = info.STUDENT_NAME;
    item.GENDER = info.GENDER;
    item.AGE = info.AGE;
    item.STUDENT_ID = info.STUDENT_ID;
    item.GRADE = info.GRADE;
    item.MOBILE_PHONE = info.MOBILE_PHONE;
    item.AVATAR = info.AVATAR;
    item.ORG_ID = info.ORG_ID;
  });
  return result;
}

exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  let result = [];
  let response = {};
  
  if (event.role != '3') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }

  getProperStudents(event.activityId)
    .then(res => {
      console.log(JSON.stringify(res.Items));
      result = res.Items;
      return getAttributes(result);
    })
    .then(res => {
      console.log(JSON.stringify(res));
      let response = addAttributes(res, result);
      console.log(JSON.stringify(response));
      callback(null, response);
    })
    .catch(err => {
      console.log("Error!");
      console.log(JSON.stringify(err));
      callback(err, null);
    });
};