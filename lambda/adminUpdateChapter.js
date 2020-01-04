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
    console.log(JSON.stringify(event));
    var response = {};
    if (event.role != "4") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var chapter_name = event.chapter_name;
    var desc = event.desc;
    var id = event.chapter_id;
    var course_id = event.course_id;

    getIndex(course_id, id).then(index => {
        var params = {
            TableName: 'CEDSI_CURRICULUMS',
            Key: {
                ID: course_id
            },
            UpdateExpression: "SET CHAPTERS[:index].CP_NAME = :name, CHAPTERS[:index].CP_DESCRIPTION = :desc",
            ConditionExpression: "",
            ExpressionAttributeValues: {
                ":index": index,
                ":name": chapter_name,
                ":desc": desc
            }
        };

        docClient.update(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                callback(err, null);
            } else {
                callback(null, {
                    status: "ok"
                })
            }
        });
    })
};
