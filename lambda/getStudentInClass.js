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
  
exports.handler = (event, context, callback) => {
    var class_id = event.class_id;
    var response = {};
    if (event.role != "3") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    getAccountCode(event.principalId).then(org_id => {
        var params = {
            TableName: 'CEDSI_STUDENT',
            IndexName: 'ORG_ID',
            KeyConditionExpression: 'ORG_ID = :id',
            FilterExpression: "contains(CLASSES, :c)",
            ExpressionAttributeValues: {
                ':id': org_id,
                ":c": class_id
            },
            ProjectionExpression:"STUDENT_INFO"
        };
        
        docClient.get(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                callback(err, null);
            } else {
                callback(null, data);
            }
        });
    })
};
