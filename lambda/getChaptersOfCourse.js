'use strict'
var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();
var response = {};

function getFinishedChapters(sid, course_id) {
    var params = {
        TableName: 'CEDSI_STUDENT_COURSE_INFO',
        KeyConditionExpression: "STUDENT_ID = :sid and COURSE_ID = :cid",
        ExpressionAttributeValues: {
            ":sid": sid,
            ":cid": course_id
        }
    };
    return new Promise((resolve, reject) => {
        docClient.query(params, function (err, data) {
            if (err) {
                console.log("读取数据库失败");
                response.status = "fail";
                response.err = err;
                reject(err);
            } else {
                var finished_chapter = [];
                if (data.Items[0]) {
                    for (var i = 0; i < data.Items[0].FINISH_CHAPTER.length; i++) {
                        finished_chapter = data.Items[0].FINISH_CHAPTER;
                    }
                }
                resolve(finished_chapter);
            }
        });
    });
}

function getChapters(cid, finish_chapter) {
    var params = {
        TableName: "CEDSI_CHAPTERS",
        IndexName: "COURSE_ID",
        KeyConditionExpression: "COURSE_ID = :cid",
        ExpressionAttributeValues: {
            ":cid": cid
        }
    };

    return new Promise((resolve, reject) => {
        docClient.query(params, async function (err, data) {
            if (err) {
                console.log(err);
                response.status = "fail";
                response.err = err;
                reject(err);
            } else {
                var result = {};
                result.finish_chapters = finish_chapter;
                result.chapters = data.Items;
                resolve(result);
            }
        });
    });
}

function replace(chapters) {
    return new Promise((resolve, reject) => {
        var result = [];
        var m = 0;
        chapters.every(async chapter => {
            if (chapter.CP_RESOURCE) {
                var data = await getResource(chapter.CP_RESOURCE);
                if (data) {
                        data.CEDSI_RESOURCE.forEach(item => {
                            var suffix = item.RS_URL.split(".");
                            if (suffix[suffix.length - 1].replace(/\s*/g, "") == 'jpg') {
                                if (!chapter.CP_RESOURCE) {
                                    chapter.CP_RESOURCE = {};
                                }
                                chapter.CP_RESOURCE.LECTURE = item.RS_URL;
                            } else if (suffix[suffix.length - 1].replace(/\s*/g, "") == 'mp4') {
                                if (!chapter.CP_RESOURCE) {
                                    chapter.CP_RESOURCE = {};
                                }
                                chapter.CP_RESOURCE.VIDEO = item.RS_URL;
                            } else if (suffix[suffix.length - 1].replace(/\s*/g, "") == 'sb3') {
                                if (!chapter.CP_RESOURCE) {
                                    chapter.CP_RESOURCE = {};
                                }
                                chapter.CP_RESOURCE.TEMPLATE = item.RS_URL;
                            }
                        });

                    }
                    result.push(chapter);
                    m++;
                    if (m == chapters.length) {
                        resolve(result);
                    }
                    return true;
            } else {
                result.push(chapter);
                m++;
                if (m == chapters.length) {
                    resolve(result);
                }
                return true;
            }
        });
    });
}

function keysort(key, sortType) {
    return function (a, b) {
        return sortType ? (~~a[key] - ~~b[key]) : (~~a[key] - ~~b[key]);
    };
}

function getCourseName(id) {
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        Key: {
            ID: id
        }
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.log(err);
                response.status = "fail";
                response.err = err;
                reject(err);
            } else {
                resolve(data.Item.COURSE_NAME);
            }
        });
    });
}

function getResource(resource) {
    var keys = [];
    if (resource.VIDEO) {
        keys.push({
            RS_ID: resource.VIDEO
        });
    }
    if (resource.LECTURE) {
        keys.push({
            RS_ID: resource.LECTURE
        });
    }
    if (resource.TEMPLATE) {
        keys.push({
            RS_ID: resource.TEMPLATE
        });
    }
    if (keys == []) {
        return null;
    }
    var params = {
        RequestItems: {
            'CEDSI_RESOURCE': {
                Keys: keys,
                ProjectionExpression: "RS_URL"
            }
        }
    };
    return new Promise((resolve, reject) => {
        docClient.batchGet(params, function (err, data) {
            if (err) {
                console.log(err);
                response.status = "fail";
                response.err = err;
                reject(err);
            } else {
                resolve(data.Responses);
            }
        });
    });
}

exports.handler = function (event, context, callback) {
    var cid = event.course_id;
    var sid = event.principalId;
    console.log(JSON.stringify(event));
    getCourseName(cid).then(data => {
        response.data = {};
        response.data.courseName = data;

        return getFinishedChapters(sid, cid);
    }).then(function (data) {

        return getChapters(cid, data);
    }).then(function (data) {
        data.chapters = data.chapters.sort(keysort('CP_NUMBER', false));
        response.data.chapter_message = data;
        replace(data.chapters).then(data => {
            response.data.chapter_message.chapters = data.sort(keysort('CP_NUMBER', false));
            callback(null, response);
        });
    });

};