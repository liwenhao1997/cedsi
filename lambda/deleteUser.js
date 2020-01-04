'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    var response = {};
    console.log(JSON.stringify(event));
    
    if(event.role != "5") {
       response.status = "fail";
       response.err = "非法访问!";
       callback(null,response);
       return;
    }
    var user_id = event.user_id;
    var params = {
        TableName: 'AUTH_USER',
        Key: {
            "USER_ID": user_id
        },
        UpdateExpression: "set USER_STATUS = #status",
        ExpressionAttributeValues: {
            "#status": "disable"
        }
    };

    docClient.update(params, function (err, data) {
        if (err) {
            console.error(JSON.stringify(err));
            response.status = "fail";
            response.err = err;
            callback(response,null);
        } else {
            response.status = "ok";
            callback(null,response);
        }
    });
};
