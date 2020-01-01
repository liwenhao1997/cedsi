'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    var courseList = event.courseList;
    var org_id = event.id;
    
    var params = {
        TableName: 'CEDSI_ORG',
        Key: {
            ORG_ID: org_id
        },
        UpdateExpression: "SET AUTHORIZATION_COURSES = :data",
        ExpressionAttributeValues: {
            ":data": courseList
        }
    };

    docClient.update(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
        } else {
            console.log(data);
        }
    });
};

