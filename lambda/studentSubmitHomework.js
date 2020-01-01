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

function getCourseInfo(keys) {
  let params = {
    RequestItems: {
      "CEDSI_CLASS": {
        Keys: keys,
        ProjectionExpression: "COURSE_ID,COURSE_NAME,CLASS_ID"
      }
    }
  };
  return new Promise((resolve, reject) => {
    docClient.batchGet(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function getStudentClasses(studentId) {
  let params = {
    TableName: "CEDSI_STUDENT",
    KeyConditionExpression: 'USER_ID = :u',
    ExpressionAttributeValues: { ':u': studentId },
    ProjectionExpression: 'CLASS_ID,STUDENT_NAME,ORG_ID'
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}


function insertHomework(result, event) {
  // let prefix = "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/homework";
  let params = {
    TableName: "CEDSI_STUDENT_HOMEWORK",
    Item: {
      "CP_ID": event.chapterId,
      "STUDENT_ID": event.principalId,
      "CP_NAME": event.chapterName,
      "HW_NAME": event.homeworkName,
      "HW_DESCRIPTION": event.homeworkDesc,
      "HW_GUIDE": event.homeworkGuide,
      "HW_ID": result.ID,
      "CLASS_ID": result.classId,
      "COURSE_ID": result.courseId,
      "COURSE_NAME": result.courseName,
      "ORG_CODE": result.ORG_ID,
      "STUDENT_NAME": result.studentName,
      "HW_URL": `/homework/work/${result.ID}.${event.type}`,
      "DEADLINE": "null",
      "HW_RANK": "null",
      "TEACHER_REMARK": "null",
      "SELECTED_WORKS": false,
      "SUBMIT_TIME": Date.now().toString(),
    }
  };
  console.log(JSON.stringify(params));
  return new Promise((resolve, reject) => {
    docClient.put(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

exports.handler = (event, context, callback) => {
  let response = {};
  let result = { ID: uuid.v4() };

  console.log(JSON.stringify(event));
  if (event.role != '1') {
    response.status = 'fail';
    response.err = "非法访问!";
    callback(response, null);
  }

  getStudentClasses(event.principalId)
    .then(res => {
      console.log(JSON.stringify(res));
      result.ORG_ID = res.Items[0].ORG_ID;
      result.studentName = res.Items[0].STUDENT_NAME;
      let keys = res.Items.map(item => {
        return { CLASS_ID: item.CLASS_ID };
      });
      return getCourseInfo(keys);
    })
    .then(res => {
      console.log(JSON.stringify(res));
      let course = res.Responses.CEDSI_CLASS.find(item => {
        return item.COURSE_ID === event.courseId;
      });
      result.courseId = course.COURSE_ID;
      result.courseName = course.COURSE_NAME;
      result.classId = course.CLASS_ID;
      return insertHomework(result, event);
    })
    .then(res => {
      console.log(JSON.stringify(res));
      return getToken();
    })
    .then(data => {
      data.Credentials.id = result.ID;
      response.status = '200';
      response.data = data.Credentials;
      callback(null, response);
    })
    .catch(err => { console.log("ERROR!"); console.log(JSON.stringify(err)) });
};