'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient();

function getAuthorizationCourse(code) {
    var params = {
        TableName: 'CEDSI_ORG',
        IndexName: 'ORG_CODE',
        KeyConditionExpression: 'ORG_CODE = :id',
        ExpressionAttributeValues: {
            ':id': code
        },
        ProjectionExpression: "AUTHORIZATION_COURSES"
    };
    return new Promise((resolve, reject) => {
        docClient.query(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Items[0].AUTHORIZATION_COURSES);
            }
        });
    });
}
// function getCourseName(list) {
//     var request = [];
//     list.forEach(element => {
//         request.push({
//             ID: element
//         });
//     });
//     var params = {
//         RequestItems: {
//             'CEDSI_CURRICULUMS': {
//                 Keys: request,
//                 ProjectionExpression: "COURSE_NAME,ID"
//             }
//         }
//     };
//     return new Promise((resolve, reject) => {
//         docClient.batchGet(params, function(err, data) {
//             if(err) {
//                 reject(err);
//             } else {
//                 resolve(data.Responses.CEDSI_CURRICULUMS);
//             }
//         });
//     });
// }
function getTeachers(code) {
    var params = {
        TableName: 'CEDSI_TEACHER',
        IndexName: 'ORG_CODE',
        KeyConditionExpression: 'ORG_CODE = :code',
        FilterExpression: "TEACHER_STATUS = :s",
        ExpressionAttributeValues: {
            ':code': code,
            ':s': "active"
        },
        
        ProjectionExpression: "TEACHER_ID,TEACHER_NAME"
    };
    return new Promise((resolve, reject) => {
        docClient.query(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Items);
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
        callback(response,null);
        return;
    }
    var id = event.principalId;
    getAccountCode(id).then(data0 => {
        getTeachers(data0.ACCOUNT_ID).then(data => {
            response.teacher = data;
            getAuthorizationCourse(data0.ACCOUNT_ID).then(data => {
                //getCourseName(data).then(data => {
                    response.course = data;
                    response.status = "ok";
                    callback(null, response);
                //});
            });
        });
    });
};