'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

var CEDSI_STUDENT = [];
var CEDSI_STUDENT_COURSE_INFO = [];

function build_CEDSI_STUDENT(element, class_id) {
    var template = {};
    template.PutRequest = {};
    var item = {
        "AGE": element.age,
        "AVATAR": element.avatar,
        "CLASS_ID": class_id,
        "GENDER": element.gender,
        "MOBILE_PHONE": element.mobile,
        "ORG_ID": element.org_id,
        "STUDENT_ID": element.id,
        "STUDENT_NAME": element.name,
        "USER_ID": element.user_id,
        "GRADE": element.grade
    };
    template.PutRequest.Item = item;
    CEDSI_STUDENT.push(template);
}

function allocationCourses(student_id,course_id) {
    var template = {};
    template.PutRequest = {};
    var item = {
        "COURSE_ID": course_id,
        "FINISH_CHAPTER": [],
        "STUDENT_ID": student_id,
        "CREATE_TIME": Date.now()
    };
    template.PutRequest.Item = item;
    CEDSI_STUDENT_COURSE_INFO.push(template);
}

async function build(data, class_id) {
    var i = 0;
    var course_id = await getCourse(class_id);
    return new Promise((resolve, reject) => {
        data.forEach(function (element) {
            allocationCourses(element.user_id,course_id);
            build_CEDSI_STUDENT(element, class_id);
            i++;
            if (i == data.length) {
                resolve("1");
            }
        });
    });
}

function getCourse(class_id) {
    var params = {
        TableName: 'CEDSI_CLASS',
        Key: {
            CLASS_ID: class_id
        },
        ProjectionExpression: "COURSE_ID"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(JSON.stringify(err));
            } else {
                resolve(data.Item.COURSE_ID);
            }
        });
    });
}
function updateCourseMsg(class_id, len) {
    var params = {
        TableName: 'CEDSI_CLASS',
        Key: {
            CLASS_ID: class_id
        },
        UpdateExpression: "SET CLASS_MEMBER_COUNT = :len",
        ExpressionAttributeValues: {
            ":len": len
        }
    };

    docClient.update(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
        } else {
            console.log(data);
        }
    });
}
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var response = {};
    if (event.role != "3") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        response = {};
        return;
    }
    var studentData = event.studentData;
    updateCourseMsg(event.class_id,studentData.length - 2);
    build(studentData, event.class_id).then(data => {
        if (data == "1") {
            var params = {
                RequestItems: {
                    'CEDSI_STUDENT': CEDSI_STUDENT,
                    'CEDSI_STUDENT_COURSE_INFO': CEDSI_STUDENT_COURSE_INFO
                }
            };
            docClient.batchWrite(params, function (err, data) {
                if (err) {
                    console.log(JSON.stringify(err));
                    response.status = "fail";
                    response.err = err;
                    callback(response, null);
                } else {
                    console.log(data);

                    response.status = "ok";
                    response.data = data;
                    callback(null, response);
                    CEDSI_STUDENT = [];
                    CEDSI_STUDENT_COURSE_INFO = [];
                }
            });
        } else {
            callback("err", null);
        }
    });
};