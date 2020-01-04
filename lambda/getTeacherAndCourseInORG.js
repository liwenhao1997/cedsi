'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient();

function getAuthorizationCourse(org_id) {
    var params = {
        TableName: 'CEDSI_ORG',
        Key: {
            ORG_ID: org_id
        },
        ProjectionExpression: "AUTHORIZATION_COURSES"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Item.AUTHORIZATION_COURSES);
            }
        });
    });
}

function getTeachers(org_id) {
    var params = {
        TableName: 'CEDSI_ORG',
        Key: {
            ORG_ID: org_id
        },
        ProjectionExpression: "TEACHERS"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                var result = [];
                var index = 0;
                data.Item.TEACHERS.forEach(item => {
                    index++;
                    if (item.TEACHER_STATUS != "disable") {
                        result.push(item);
                    }
                    if (index == data.Item.TEACHERS.length) {
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
    var response = {};
    if (event.role != "3") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var id = event.principalId;
    getAccountCode(id).then(data0 => {
        getTeachers(data0.ACCOUNT_ID).then(data => {
            response.teacher = data;
            getAuthorizationCourse(data0.ACCOUNT_ID).then(data => {
                response.course = data;
                response.status = "ok";
                callback(null, response);
            });
        });
    });
};