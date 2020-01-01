'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    var id = event.course_id;
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        Key: {
            ID: id
        }
    };

    docClient.get(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err, null);
        } else {
            console.log(data);
            callback(null, data.Item);
        }
    });
};

