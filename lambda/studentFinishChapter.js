'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function checkChapter(cp_id, course_id, id) {
    var params = {
        TableName: 'CEDSI_STUDENT',
        Key: {
            USER_ID: id
        },
        ProjectionExpression: "COURSE_INFO"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                var ids = 0;
                data.Item.COURSE_INFO.forEach(item => {
                    if (item.COURSE_ID == course_id) {
                        var result = item.FINISH_CHAPTER;
                        for (var i = 0; i < result.length; i++) {
                            if (cp_id == result[i].CP_ID) {
                                resolve({
                                    exits: false
                                });
                            }
                            if (i == result.length - 1) {
                                resolve({
                                    exits: true,
                                    index: ids
                                });
                            }
                        }
                    }
                    ids++;
                })

            }
        });
    });
}
exports.handler = (event, context, callback) => {
    var cp_id = event.cp_id;
    var course_id = event.course_id;
    var id = event.principalId;

    checkChapter(cp_id, course_id, id).then(data => {
        if (data.exits) {
            var params = {
                TableName: 'CEDSI_STUDENT',
                Key: {
                    USER_ID: id
                },
                UpdateExpression: "SET COURSE_INFO[:index].FINISH_CHAPTER = list_append(if_not_exists(COURSE_INFO[:index].FINISH_CHAPTER, :empty_object), :data)",
                ExpressionAttributeValues: {
                    ":empty_object": [],
                    ":index": data.index,
                    ":data": [{
                        "CP_FINISH_TIME": Date.now(),
                        "CP_ID": cp_id
                    }]
                }
            };
            docClient.update(params, function (err, data) {
                if (err) {
                    console.error(JSON.stringify(err));
                    callback(err, null);
                } else {
                    callback(null, {
                        status: "ok"
                    });
                }
            });
        }
    });

};