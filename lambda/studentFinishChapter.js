'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function checkChapter(cp_id,course_id,id) {
    var params = {
        TableName: 'CEDSI_STUDENT_COURSE_INFO',
        Key: {
            STUDENT_ID: id,
            COURSE_ID: course_id
        }
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                var result = data.Item.FINISH_CHAPTER;
                for (var i = 0; i < result.length; i++) {
                    if (cp_id == result[i].CP_ID) {
                        resolve(true);
                    }
                    if (i == result.length - 1) {
                        resolve(false);
                    }
                }
            }
        });
    });
}
exports.handler = (event, context, callback) => {
    var cp_id = event.cp_id;
    var course_id = event.course_id;
    var id = event.principalId;
    
    checkChapter(cp_id,course_id,id).then(data => {
        if (!data) {
            var params = {
                TableName: 'CEDSI_STUDENT_COURSE_INFO',
                Key: {
                    STUDENT_ID: id,
                    COURSE_ID: course_id
                },
                UpdateExpression: "SET FINISH_CHAPTER = list_append(if_not_exists(FINISH_CHAPTER, :empty_object), :data)",
                ExpressionAttributeValues: {
                    ":empty_object": [],
                    ":data": [{
                        "CP_FINISH_TIME": Date.now(),
                        "CP_ID": cp_id
                    }]
                }
            };
            docClient.update(params, function (err, data) {
                if (err) {
                    console.error(JSON.stringify(err));
                } else {
                    return;
                }
            });
        }
    });
    
};