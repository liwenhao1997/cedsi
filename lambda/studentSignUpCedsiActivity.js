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
    var activity = {
        ACTIVITY_ID: event.avtivity_id,
        JOIN_TIME: Date.now()
    };
    let params = {
        TableName: 'CEDSI_STUDENT',
        Key: {
            USER_ID: event.principalId
        },
        UpdateExpression: 'SET ACTIVITIES = list_append(if_not_exists(ACTIVITIES, :empty_object), :activity)',
        ExpressionAttributeValues: {
            ":empty_object": [],
            ":activity": activity
        }
    };
    docClient.update(params, function (err, data) {
        if (err) {
            console.error(JSON.stringify(err));
            callback(err, null);
        }
        else {
            callback(null, { status: "ok" });
        }
    });
};