'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function keysort(key, sortType) {
    return function (a, b) {
        return sortType ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
    };
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var response = {};
    if (event.role != "5") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var params = {
        TableName: 'AUTH_USER',
        FilterExpression: 'ROLE_ID = :id',
        ProjectionExpression: "USER_INFO",
        ExpressionAttributeValues: {
            ':id': "4"
        }
    };

    docClient.scan(params, function (err, data) {
        if (err) {
            console.error(JSON.stringify(err.errMessage));
            callback(err, null);
        } else {
            response.status = "ok";
            response.data = data.Items.sort(keysort('CREATE_TIME', true));
            callback(null, response);
        }
    });
};