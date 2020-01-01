'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var name = event.name;
    var comment = event.comment;
    var id = event.id;
    var params = {
        TableName: 'CEDSI_RESOURCE',
        Key: {
            RS_ID: id
        },
        UpdateExpression: "SET RS_COMMENT = :comment, RS_NAME = :name",
        ExpressionAttributeValues: {
            ":comment": comment,
            ":name": name
        }
    };

    docClient.update(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err, null);
        } else {
            console.log(data);
            callback(null, data);
        }
    });
};
