'use strict'
var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();
var response = {};

function getFinishedChapters(sid, course_id) {
    var params = {
        TableName: 'CEDSI_STUDENT',
        Key: {
            USER_ID: sid
        },
        ProjectionExpression: "COURSE_INFO"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                response.status = "fail";
                response.err = err;
                reject(err);
            } else {
                if (data.Item.COURSE_INFO) {
                    data.Item.COURSE_INFO.forEach(item => {
                        if (item.COURSE_ID == course_id) {
                            resolve(item.FINISH_CHAPTER);
                        }
                    })
                }

            }
        });
    });
}

function getChapters(cid, finish_chapter) {
    var params = {
        TableName: "CEDSI_CURRICULUMS",
        Key: {
            ID: cid
        }
    };

    return new Promise((resolve, reject) => {
        docClient.get(params, async function (err, data) {
            if (err) {
                console.error(err);
                response.status = "fail";
                response.err = err;
                reject(err);
            } else {
                var result = {};
                result.finish_chapters = finish_chapter;
                result.chapters = data.Item.CHAPTERS;
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
                chapter.CP_RESOURCE.forEach(item => {
                    var suffix = item.RS_URL.split(".");
                    suffix = suffix[suffix.length - 1].replace(/\s*/g, "");
                    if (suffix == 'jpg' || suffix == "jpeg") {
                        if (!chapter.CP_RESOURCE) {
                            chapter.CP_RESOURCE = {};
                        }
                        chapter.CP_RESOURCE.LECTURE = item.RS_URL;
                    } else if (suffix == 'mp4') {
                        if (!chapter.CP_RESOURCE) {
                            chapter.CP_RESOURCE = {};
                        }
                        chapter.CP_RESOURCE.VIDEO = item.RS_URL;
                    } else if (suffix == 'sb3') {
                        if (!chapter.CP_RESOURCE) {
                            chapter.CP_RESOURCE = {};
                        }
                        chapter.CP_RESOURCE.TEMPLATE = item.RS_URL;
                    }
                    result.push(chapter);
                    m++;
                    if (m == chapters.length) {
                        resolve(result);
                    }
                })
            } else {
                result.push(chapter);
                m++;
                if (m == chapters.length) {
                    resolve(result);
                }
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
                console.error(err);
                response.status = "fail";
                response.err = err;
                reject(err);
            } else {
                resolve(data.Item.COURSE_NAME);
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