'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function getIndex(courseId, chapterId) {
    var params = {
        TableName: "CEDSI_CURRICULUMS",
        Key: {
            ID: courseId
        },
        ProjectionExpression: "CHAPTERS"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                var index = 0;
                data.Item.CHAPTERS.forEach(element => {
                    if (element.CP_ID == chapterId) {
                        resolve(index);
                    }
                    index++;
                });
            }
        });
    })
}
exports.handler = (event, context, callback) => {
    var cid = event.chapter_id;
    var courseId = event.courseId;
    var response = {};
    if (event.role != "4") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    getIndex(courseId, chapterId).then(index => {
        var params = {
            TableName: 'CEDSI_CURRICULUMS',
            Key: {
                "CP_ID": cid
            },
            UpdateExpression: "REMOVE CHAPTERS[:index]",
            ExpressionAttributeValues: {
                ':index': index
            },
        };

        docClient.update(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                callback(err, {
                    status: error
                });
            } else {
                callback(null, {
                    status: "ok"
                })
            }
        });
    })

};
