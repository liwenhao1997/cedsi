'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient();

function getAccountCode(id) {
    var params = {
        TableName: 'CEDSI_TEACHER',
        Key: {
            TEACHER_ID: id
        },
        ProjectionExpression: "ORG_ID"
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
    if (event.role != "2") {
        response.status = "fail";
        response.data = "非法访问";
        callback(response, null);
        return;
    }
    var class_id = event.class_id;
    getAccountCode(event.principalId).then(org_id => {
        var params = {
            TableName: 'CEDSI_STUDENT',
            IndexName: 'ORG_ID',
            KeyConditionExpression: 'ORG_ID = :id',
            ExpressionAttributeValues: {
                ':id': org_id
            },
            ProjectionExpression: "HOMEWORKS"
        };
        docClient.query(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                callback(err, null);
            } else {
                var result = [];
                var i = 0;
                data.Items.every(item => {
                    item.HOMEWORKS.every(ele => {
                        if (ele.CLASS_ID == class_id) {
                            ele.STUDENT_ID = item.USER_ID;
                            ele.STUDENT_NAME = item.STUDENT_INFO.STUDENT_NAME;
                            result.push(ele);
                            return false;
                        }
                    })
                    if (++i == data.Items.length) {
                        response.status = "ok";
                        response.data = result;
                        callback(null, response);
                    }
                })
            }
        });
    })
};