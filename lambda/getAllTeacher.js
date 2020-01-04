'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
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

function getTeacher(org_id) {
    var params = {
        TableName: 'CEDSI_TEACHER',
        IndexName: 'ORG_ID',
        KeyConditionExpression: 'ORG_ID = :id',
        ExpressionAttributeValues: {
            ':id': org_id
        },
        ProjectionExpression: "TEACHER_ID,JOB_NUMBER,TEACHER_NAME,GENDER,INTRO,TEACHER_STATUS"
    };
    return new Promise((resolve, reject) => {
        docClient.query(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                reject(err);
            } else {
                var response = [];
                var length = data.Items.length;
                response = data.Items.forEach(item => {
                    if (item.TEACHER_STATUS == "disable") {
                        length--;
                    } else{
                        response.push(item);
                    }
                    if(response.length == length) {
                        resolve(response);
                    }
                });
            }
        });
    });
}
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var id = event.principalId;
    getAccountCode(id).then(data => {
        getTeacher(data.ACCOUNT_ID).then(data => {
            callback(null, data);
        }).catch(err => {
            console.error(JSON.stringify(err));
            callback(err, null);
        });
    });
};
