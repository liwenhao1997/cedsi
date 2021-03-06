'use strict';
var AWS = require('aws-sdk');
var uuid = require('uuid');
AWS.config = new AWS.Config({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

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
    console.log(JSON.stringify(event));
    if (event.role != "3") {
        var response = {};
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var class_name = event.class_name;
    var teacher_id = event.teacher_id;
    var course_id = event.course_id;
    var course_name = event.course_name;
    var id = event.principalId;

    var class_id = uuid.v4();

    getAccountCode(id).then(data => {
        var clazz = {
            "CLASS_ID": class_id,
            "CLASS_NAME": class_name,
            "COURSE_ID": course_id,
            "COURSE_NAME": course_name,
            "HISTORY_COURSE": [],
            "TEACHER_ID": teacher_id,
            "CLASS_MEMBER_COUNT": 0,
            "CREATE_TIME": Date.now()
        }
        var params = {
            TableName: 'CEDSI_CLASS',
            Key: {
                ORG_ID: data.ACCOUNT_ID
            },
            UpdateExpression: "SET ORG_CLASSES = list_append(if_not_exists(ORG_CLASSES, :empty_object), :class)",
            ExpressionAttributeValues: {
                ":empty_object": [],
                ":class": clazz
            }
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                callback(err, null);
            } else {
                callback(null, { status: "ok", classId: class_id });
            }
        });
    });
};