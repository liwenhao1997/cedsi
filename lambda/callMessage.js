'use strict';
var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();

function getTeacherMsg(id) {
    var params = {
        TableName: "AUTH_USER",
        Key: {
            USER_ID: id
        },
        ProjectionExpression: "USER_INFO.NICK_NAME,USER_INFO.AVATAR"
    };
    return new Promise((resolve, reject) => {
        docClient.query(params, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                resolve(data.Item);
            }
        });
    });
}
function filter(arr, type) {
    return new Promise((resolve, reject) => {
        var result = [], i = 0;
        arr.forEach(item => {
            if (item.MESSAGE_TYPE == type) {
                result.push(item);
            }
            if (++i == arr.length) {
                resolve(result);
            }
        })
    });
}
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var student_id = event.principalId;
    var type = event.type;
    var params = {
        TableName: "CEDSI_STUDENT",
        Key: {
            USER_ID: student_id
        },
        ProjectionExpression: "STUDENT_MESSAGE"
    };
    docClient.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            filter(data.Item.STUDENT_MESSAGE).then(result => {
                var i = 0;
                result.forEach(function (item) {
                    getTeacherMsg(item.DISPATCH_ID).then(data => {
                        result[i].avatar = data.USER_INFO.AVATAR;
                        result[i].teacher_name = data.USER_INFO.NICK_NAME;
                        delete result[i].dispatcherID;
                        delete result[i].recipientID;
                        if (++i == result.length) {
                            callback(null, result);
                        }
                    });
                });
            })
        }

    });
};
