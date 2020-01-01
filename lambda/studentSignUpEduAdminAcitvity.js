'use strict';
let AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    let response = {};
    console.log(JSON.stringify(event));
    if (event.role != '1') {
        response.status = 'fail';
        response.err = "非法访问!";
        callback(response, null);
    }
    let params = {
        TableName: 'CEDSI_STUDENT_ACTIVITY',
        Item: {
            ACTIVITY_ID: event.avtivityId,
            USER_ID: event.principalId,
            JOIN_TIME: Date.now()
        }
    };
    docClient.put(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err, null);
        }
        else {
            console.log(data);
            callback(null, { status: 200 });
        }
    });
};