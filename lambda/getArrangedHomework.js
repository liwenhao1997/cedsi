'use strict';
var AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
var docClient = new AWS.DynamoDB.DocumentClient;

function getArrangedHomework(principalId) {
  let params = {
    TableName: "CEDSI_TEACHER",
    Key: {
      TEACHER_ID: principalId
    },
    ProjectionExpression: "HOMEWORKS"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getChapterName(courseId,chapterId) {
  let params = {
    TableName: "CEDSI_CURRICULUMS",
    Key: {
      ID: courseId
    },
    ProjectionExpression: "CHAPTERS"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        data.Item.forEach(item => {
          if (item.CP_ID == chapterId) {
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

function getClassAndCourseName(orgId, classId) {
  let params = {
    TableName: "CEDSI_ORG",
    Key: {
      ORG_ID: orgId
    },
    ProjectionExpression: "ORG_CLASSES"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, function (err, data) {
      if (err) {
        reject(err);
    } else {
        data.Item.forEach(item => {
          if (item.CLASS_ID == classId) {
            resolve(item);
          }
        })
    }
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
      items = res.Item.HOMEWORK;
      return addAttributes(res.Item.HOMEWORK);
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