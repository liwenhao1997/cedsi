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
function getUserById(id) {
    var params = {
        TableName: 'AUTH_USER',
        Key: {
            USER_ID: id
        },
        ProjectionExpression: "USER_INFO.NICK_NAME"
    };

    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Item);
            }
        });
    });
}
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var response = {};
    if (event.role != "4") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var id = event.course_id;
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        Key: {
            ID: id
        },
        ProjectionExpression: "CHAPTERS"
    };

    docClient.get(params, function (err, data) {
        response.data = [];
        if (err) {
            console.log(JSON.stringify(err));
            response.status = "error";
            callback(response, null);
        } else {
            var result = data.Item.CHAPTERS;
            var i = 0;
            result.forEach(async function (item) {
                delete item.CP_RESOURCE;
                await getUserById(item.CP_FOUNDER).then(data => {
                    item.CP_FOUNDER = data.USER_INFO.NICK_NAME;
                    if (i == result.length - 1) {
                        result = result.sort(keysort("CP_NUMBER", false));
                        response.status = "ok";
                        response.data = result;
                        callback(null, response);
                    }
                });
                i++;
            });
        }
    });
};