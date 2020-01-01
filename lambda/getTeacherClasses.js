'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient();

/**
 * 获取课程对于的章节的数量
 *
 * @param {String} courseID
 * @returns
 */
function getChapterNum(courseID) {
  let params = {
    TableName: "CEDSI_CHAPTERS",
    IndexName: "COURSE_ID",
    KeyConditionExpression: 'COURSE_ID = :id',
    ExpressionAttributeValues: {
      ':id': courseID
    }
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

/**
 * 获取老师所带的班级
 *
 * @param {String} teacherID
 * @returns
 */
function getClassesWithTeacherID(teacherID) {
  let params = {
    TableName: 'CEDSI_CLASS',
    IndexName: "TEACHER_ID",
    KeyConditionExpression: 'TEACHER_ID = :id',
    ExpressionAttributeValues: {
      ':id': teacherID
    },
    ProjectionExpression: "CLASS_ID,CLASS_NAME,COURSE_ID,COURSE_NAME,CLASS_MEMBER_COUNT"
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {
  let id = event.principalId;
  let classes = [];
  getClassesWithTeacherID(id)
    .then(res => {
      classes = res.Items;
      let promises = classes.map(item => getChapterNum(item.COURSE_ID));
      return Promise.all(promises);
    })
    .then(res => {
      classes = classes.map((item, index) => {
        item.CHAPTER_NUM = res[index].Count;
        return item;
      });
      console.log(JSON.stringify(classes));
      callback(null, classes);
    })
    .catch(err => {
      console.log("ERROR!");
      console.log(JSON.stringify(err));
      callback(err, null);
    });
};
