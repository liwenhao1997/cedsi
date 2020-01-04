'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function keysort(key, sortType) {
    return function (a, b) {
        return sortType ? (~~a[key] - ~~b[key]) : (~~a[key] - ~~b[key]);
    };
}

exports.handler = (event, context, callback) => {
    var id = event.principalId;
    var params = {
        TableName: 'AUTH_USER',
        Key: {
            USER_ID: id
        },
        ProjectionExpression: "USER_ORDER"
    };
    docClient.get(params, function (err, data) {
        if (err) {
            callback(JSON.stringify(err), null);
        } else {
            data.Item.USER_ORDER = data.Item.USER_ORDER.sort(keysort("COMMIT_TIME"), false);
            callback(null, data.Item);
        }
    });
};