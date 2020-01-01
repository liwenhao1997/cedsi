'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    var class_id = event.class_id;
    var response = {};
    if (event.role != "3") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var params = {
        TableName: 'CEDSI_STUDENT',
        IndexName: 'CLASS_ID',
        KeyConditionExpression: 'CLASS_ID = :id',
        ExpressionAttributeValues: {
            ':id': class_id
        },
        ProjectionExpression:"AGE,GENDER,GRADE,STUDENT_ID,STUDENT_NAME,MOBILE_PHONE"
    };
    
    docClient.query(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err, null);
        } else {
            console.log(data.Items);
            callback(null, data);
        }
    });
};
