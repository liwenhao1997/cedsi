'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var response = {};
    if(event.role != "5") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response,null);
        return;
    }
    var user_id = event.user_id;
    var status = event.status;

    var params = {
        TableName: 'AUTH_USER',
        Key: {
            "USER_ID": user_id
        },
        UpdateExpression: "set #s = :status",
        ExpressionAttributeNames: {
            "#s" : "USER_STATUS"
        },
        ExpressionAttributeValues: {
            ":status": status
        }
    };

    docClient.update(params, function (err, data) {
        
        if (err) {
            console.log(JSON.stringify(err));
            response.status = "fail";
            callback(response,null);
        } else {
            response.status = "ok";
            callback(null,response);
        }
    });
};
