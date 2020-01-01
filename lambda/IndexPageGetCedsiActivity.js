'use strict';
var AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
var docClient = new AWS.DynamoDB.DocumentClient;

function getCedsiActivity() {
  let params = { TableName: "CEDSI_ACTIVITY" };
  return new Promise((resolve, reject) => {
    docClient.scan(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getTeacherAvatar(keys) {
  let params = {
    RequestItems: {
      'USER_INFO': {
        Keys: keys,
        ProjectionExpression: 'USER_ID,AVATAR'
      }
    }
  };
  return new Promise((resolve, reject) => {
    docClient.batchGet(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getTeacherName(keys) {
  let params = {
    RequestItems: {
      'CEDSI_TEACHER': {
        Keys: keys,
        ProjectionExpression: 'TEACHER_ID,TEACHER_NAME'
      }
    }
  };
  return new Promise((resolve, reject) => {
    docClient.batchGet(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

async function addAttributes(items) {
  let keys = items.map(item => item.PRINCIPAL_ID);
  let T_mapper = new Map(), A_mapper = new Map();
  let T_keys = item => { return { TEACHER_ID: item } };
  let A_keys = item => { return { USER_ID: item } };
  let getKeys = func => { return Array.from(new Set(keys)).map(func) };
  let names = await getTeacherName(getKeys(T_keys));
  let avatars = await getTeacherAvatar(getKeys(A_keys));
  let teachers = names.Responses.CEDSI_TEACHER;
  let users = avatars.Responses.USER_INFO;
  teachers.forEach(item => {
    T_mapper.set(item.TEACHER_ID, item.TEACHER_NAME);
  });
  users.forEach(item => {
    A_mapper.set(item.USER_ID, item.AVATAR);
  });
  return { T_mapper, A_mapper };
}

function cycle(T_mapper, A_mapper, activities) {
  activities.forEach(item => {
    item.TEACHER_NAME = T_mapper.get(item.PRINCIPAL_ID);
    item.AVATAR = A_mapper.get(item.PRINCIPAL_ID);
    delete item.PRINCIPAL_ID;
  });
  return activities;
}

exports.handler = (event, context, callback) => {
  let activities = [];
  getCedsiActivity()
    .then(res => {
      activities = res.Items;
      activities = activities.sort((item1, item2)=>{
        let date1 = new Date(item1.ACTIVITY_TIME);
        let date2 = new Date(item2.ACTIVITY_TIME);
        return date2 - date1;
      });
      return addAttributes(activities);
    })
    .then(({T_mapper, A_mapper}) => {
      activities = cycle(T_mapper, A_mapper, activities);
      callback(null, activities);
    })
    .catch(err => { console.log("Error!"); console.log(JSON.stringify(err)) });
};