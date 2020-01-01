'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient();

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

function getCourses(code) {
    var params = {
        TableName: 'CEDSI_ORG',
        IndexName: "ORG_CODE",
        KeyConditionExpression: 'ORG_CODE = :code',
        ExpressionAttributeValues: {
            ':code': code
        },
        ProjectionExpression: "AUTHORIZATION_COURSES"
    };
    return new Promise((resolve, reject) => {
        docClient.query(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Items[0]);
            }
        });
    });
}

exports.handler = (event, context, callback) => {
    var id = event.principalId;
    getAccountCode(id).then(data => {
        getCourses(data.ACCOUNT_ID).then(data => {
            callback(null, data);
        }).catch(err => {
            callback(err, null);
        });
    });
};