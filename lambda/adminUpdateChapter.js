'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var response = {};
    if (event.role != "4") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var chapter_name = event.chapter_name;
    var desc = event.desc;
    var id = event.chapter_id;
    
    var params = {
        TableName: 'CEDSI_CHAPTERS',
        Key: {
            CP_ID: id
        },
        UpdateExpression: "SET CP_NAME = :name, CP_DESCRIPTION = :desc",
        ExpressionAttributeValues: {
            ":name": chapter_name,
            ":desc": desc
        }
    };

    docClient.update(params, function (err, data) {
        if (err) {
            console.error(JSON.stringify(err));
        } else {
            console.log(data);
        }
    });
};
