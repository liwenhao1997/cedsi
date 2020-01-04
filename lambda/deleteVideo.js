'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;


function getUrl(course_id, chapter_id, rs_id) {
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        Key: {
            ID: course_id
        },
        ProjectionExpression: "CHAPTERS"
    };
    return new Promise((resolve, reject) => {
        var rs_ids = 0;
        docClient.get(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                reject(err);
            } else {
                var result = {};
                data.Item.CHAPTERS.forEach(element => {
                    if (element.CP_ID == chapter_id) {
                        CP_RESOURCE.forEach(item => {
                            if (item.RS_ID == rs_id) {
                                var arr = item.RS_URL.split(".cn/");
                                result.rs = arr[arr.length - 1];
                                result.cp_ids = cp_ids;
                                result.rs_ids = rs_ids;
                                resolve(result);
                            }
                            rs_ids++;
                        })
                    }
                });
            }
        });
    });
}


function deleteRS(course_id,cp_id,rs_ids) {
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        Key: {
            ID: course_id
        },
        UpdateExpression: "REMOVE CHAPTERS[:cp_ids].CP_RESOURCE[:rs_ids]",
        ExpressionAttributeValues: {
            ":cp_ids": cp_id,
            ":rs_ids": rs_ids
        }
    };
    return new Promise((resolve, reject) => {
        docClient.update(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function deleteVideo(key) {
    var s3 = new AWS.S3();
    var params = {
        Bucket: "cedsi",
        Key: key
    };
    return new Promise((resolve, reject) => {
        s3.deleteObject(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            } 
            else {
                resolve(data);
            }
        });
    });
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    if (event.role != "4") {
        var response = {};
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var course_id = event.course_id;
    var cp_id = event.cp_id;
    var rs_id = event.rs_id;
    getUrl(course_id, cp_id, rs_id).then(data => {
        deleteRS(course_id, cp_id, rs_id);
        deleteVideo(data.rs);
        callback(null, {status: "ok"});
    }).catch(err => {
        callback(err, null);
    });
};