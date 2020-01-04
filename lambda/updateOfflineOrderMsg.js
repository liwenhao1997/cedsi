'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var id = event.open_id;
    var order_id = event.order_id;
    var params = {
        TableName: 'OFFLINE_ACTIVITY_MESSAGE',
        Key: {
            OPEN_ID: id,
            ORDER_ID: order_id
        },
        UpdateExpression: "SET SIGH_STATUS = :status",
        ExpressionAttributeValues: {
            ":status": "SIGH"
        }
    };
    
    docClient.update(params, function(err, data) {
        if (err) {
            console.error(JSON.stringify(err));
            callback(err, null);
        } else {
            callback(null, data);
        }
    });
};