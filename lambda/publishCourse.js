'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    var course_id = event.course_id;
    if (event.role != "4") {
        var response = {};
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        Key: {
            ID: course_id
        },
        UpdateExpression: "SET COURSE_STATUS = :s",
        ExpressionAttributeValues: {
            ":s": "PUBLISH"
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
