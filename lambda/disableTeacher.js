'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function disableTeacher(id) {
    var params = {
        TableName: 'CEDSI_TEACHER',
        Key: {
            TEACHER_ID: id
        },
        UpdateExpression: "SET TEACHER_STATUS = :status",
        ExpressionAttributeValues: {
            ":status": "disable"
        }
    };
    return new Promise((resolve, reject) => {
        docClient.update(params, function(err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                // response.err = err;
                // response.status = "fail";
                reject(response);
            } else {
                // console.log(data);
                response.status = "ok";
                resolve(response);
            }
        });
    });
}

function disableUser(id) {
    var params = {
        TableName: 'AUTH_USER',
        Key: {
            USER_ID: id
        },
        UpdateExpression: "SET USER_STATUS = :status",
        ExpressionAttributeValues: {
            ":status": "disable"
        }
    };
    return new Promise((resolve, reject) => {
        docClient.update(params, function(err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                // response.err = err;
                // response.status = "fail";
                reject("fail");
            } else {
                // console.log(data);
                // response.status = "ok";
                resolve("ok");
            }
        });
    });
}
var response = {};
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    
    if (event.role != "3") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var id = event.teacher_id;
    disableTeacher(id).then(res => {
        return disableUser(id);
    }).then(res => {
        callback(null, {
            status: "ok"
        });
    }).catch(err => {
        console.error(JSON.stringify(err));
        callback(err);
    });
};
