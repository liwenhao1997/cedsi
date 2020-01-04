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
    TableName: "CEDSI_CURRICULUMS",
    Key: {
      ID: courseID
    },
    ProjectionExpression: "CHAPTERS"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, (err, data) => {
      err ? reject(err) : resolve(data.Item.CHAPTERS);
    });
  });
}

/**
 * 获取老师所带的班级
 *
 * @param {String} teacherID
 * @returns
 */
function getClassesWithTeacherID(orgId, teacherID) {
  let params = {
    TableName: 'CEDSI_ORG',
    Key: {
      ORG_ID: orgId
    },
    ProjectionExpression: "ORG_CLASSES"
  };
  return new Promise((resolve, reject) => {
    docClient.get(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        var result = [];
        var index = 0;
        data.Item.ORG_CLASSES.forEach(item => {
          if (item.TEACHER_ID == teacherID) {
            result.push(item);
          }
          if (++index == data.Item.ORG_CLASSES.length) {
            resolve(result);
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
exports.handler = (event, context, callback) => {
  let id = event.principalId;
  let classes = [];
  getAccountCode(id).then(org_id => {
    getClassesWithTeacherID(org_id, id)
      .then(res => {
        classes = res.Items;
        let promises = classes.map(item => getChapterNum(item.COURSE_ID));
        return Promise.all(promises);
      })
      .then(res => {
        classes = classes.map((item, index) => {
          item.CHAPTER_NUM = res[index].length;
          return item;
        });
        callback(null, classes);
      })
      .catch(err => {
        console.error(JSON.stringify(err));
        callback(err, null);
      });
  })
};
