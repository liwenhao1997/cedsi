'use strict';
var AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
var docClient = new AWS.DynamoDB.DocumentClient;

function getArrangedHomework(principalId) {
  let params = {
    TableName: "CEDSI_TEACHER_HOMEWORK",
    IndexName: 'WHO_POST',
    KeyConditionExpression: 'WHO_POST=:id',
    ExpressionAttributeValues: {
      ':id': principalId,
    }
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getChapterName(CP_ID) {
  let params = {
    TableName: "CEDSI_CHAPTERS",
    Key: { CP_ID: CP_ID },
    ProjectionExpression: "CP_NAME"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getClassAndCourseName(classId) {
  let params = {
    TableName: "CEDSI_CLASS",
    Key: { CLASS_ID: classId },
    ProjectionExpression: "CLASS_NAME,COURSE_NAME"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function addAttributes(items) {
  let chapterPromise = [];
  let classPromise = [];
  let chapters = [];
  for (let i = 0, len = items.length; i < len; i += 1) {
    chapterPromise.push(getChapterName(items[i].CP_ID));
    classPromise.push(getClassAndCourseName(items[i].CLASS_ID));
  }
  return new Promise((resolve, reject) => {
    Promise.all(chapterPromise)
      .then(chapter => {
        chapters = chapter;
        return Promise.all(classPromise);
      })
      .then(names => {
        resolve([chapters, names]);
      })
      .catch(err => { reject(err) });
  });
}

exports.handler = (event, context, callback) => {
  var response = {};
  let items = [];

  console.log(JSON.stringify(event));
  if (event.role != '2') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }

  getArrangedHomework(event.principalId)
    .then(res => {
      items = res.Items;
      console.log(JSON.stringify(res));
      return addAttributes(res.Items);
    })
    .then(([chapters, names]) => {
      for (let i = 0, len = items.length; i < len; i += 1) {
        items[i]["CP_NAME"] = chapters[i]["Item"]["CP_NAME"];
        items[i]["COURSE_NAME"] = names[i]["Item"]["COURSE_NAME"];
        items[i]["CLASS_NAME"] = names[i]["Item"]["CLASS_NAME"];
        delete items[i]["CP_ID"];
        delete items[i]["CLASS_ID"];
        delete items[i]["COURSE_ID"];
      }
      callback(null, items);
    })
    .catch(err => {
      callback(err, null);
      console.log(JSON.stringify(err));
    });
};