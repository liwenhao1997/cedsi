'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

// function build_CEDSI_STUDENT(element, class_id) {
//     var template = {};
//     template.PutRequest = {};
//     var item = {
//         STUDENT_INFO: {
//             "AGE": element.age,
//             "AVATAR": element.avatar,
//             "GENDER": element.gender,
//             "MOBILE_PHONE": element.mobile,
//             "STUDENT_ID": element.id,
//             "STUDENT_NAME": element.name,
//             "GRADE": element.grade
//         },
//         "USER_ID": element.user_id,
//     };
//     template.PutRequest.Item.STUDENT_INFO = item;
//     CEDSI_STUDENT.push(template);
// }

function append(user_id, class_id, course_id) {
    var course = {
        "COURSE_ID": course_id,
        "CREATE_TIME": String(Date.now()),
        "FINISH_CHAPTER": []
    };
    var params = {
        TableName: "CEDSI_STUDENT",
        Key: {
            USER_ID: user_id
        },
        UpdateExpression: "SET CLASSES = list_append(if_not_exists(CLASSES, :empty_object), :class), COURSE_INFO = list_append(if_not_exists(COURSE_INFO, :empty_object), :course)",
        ExpressionAttributeValues: {
            ":empty_object": [],
            ":class": class_id,
            ":course": course
        }
    };
    docClient.update(params, function (err, data) {
        if (err) {
            console.error(JSON.stringify(err));
        }
    })
}

async function build(data, class_id) {
    var i = 0;
    var course_id = await getCourse(class_id);
    return new Promise((resolve, reject) => {
        data.forEach(function (element) {
            append(element.user_id,class_id, course_id);
            // build_CEDSI_STUDENT(element, class_id);
            i++;
            if (i == data.length) {
                resolve("1");
            }
        });
    });
}

function getCourse(org_id, class_id) {
    return new Promise((resolve, reject) => {
        getIndex(org_id, class_id).then(index => {
            var params = {
                TableName: 'CEDSI_CLASS',
                Key: {
                    ORG_ID: org_id
                },
                ProjectionExpression: "ORG_CLASSES[:index].COURSE_ID",
                ExpressionAttributeValues: {
                    ":index": index
                }
            };

            docClient.get(params, function (err, data) {
                if (err) {
                    reject(JSON.stringify(err));
                } else {
                    resolve(data.Item.COURSE_ID);
                }
            });
        });
    });
}
function getOrgId(id) {
    return new Promise((resolve, reject) => {
        var params = {
            TableName: "AUTH_USER",
            Key: {
                USER_ID: id
            },
            ProjectionExpression: "ACCOUNT_ID"
        };
        docClient.get(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                reject(err);
            } else {
                resolve(data.Item.ACCOUNT_ID)
            }
        })
    })
}

function getIndex(org_id, class_id) {
    var params = {
        TableName: "CEDSI_ORG",
        Key: {
            ORG_ID: org_id
        },
        ProjectionExpression: "ORG_CLASSES"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                var index = 0;
                data.Item.ORG_CLASSES.forEach(element => {
                    if (element.CLASS_ID == class_id) {
                        resolve(index);
                    }
                    index++;
                });
            }
        });
    })
}

function updateCourseMsg(org_id, class_id, len) {
    getIndex(org_id, class_id).then(index => {
        var params = {
            TableName: 'CEDSI_ORG',
            Key: {
                ORG_ID: org_id
            },
            UpdateExpression: "SET ORG_CLASSES[:index].CLASS_MEMBER_COUNT = if_not_exists(ORG_CLASSES[:index].CLASS_MEMBER_COUNT, :zero) + :len",
            ExpressionAttributeValues: {
                ":index": index,
                ":len": len,
                ":zero": 0
            }
        };

        docClient.update(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
            }
        });
    })
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
    getOrgId(event.principalId).then(org_id => {
        updateCourseMsg(org_id, event.class_id, studentData.length - 2);
        build(studentData, event.class_id).then(data => {
            if (data == "1") {
                callback(null, {
                    status: "ok"
                })
            } else {
                callback("err", null);
            }
        });
    })
};