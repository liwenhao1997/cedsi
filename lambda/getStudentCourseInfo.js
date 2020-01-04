"use strict";

const AWS = require("aws-sdk");
AWS.config.region = 'cn-northwest-1';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

function queryChapterPromise(courseID) {
    const params = {
        TableName: "CEDSI_CURRICULUMS",
        Key: {
            ID: courseID
        }
    };
    return new Promise((resolve, reject) => dynamoDb
        .get(params, (err, data) => {
            if (err) {
                console.error(err);
                reject('Couldn\'t fetch the chapter items.');
            } else {
                resolve(data.Item.CHAPTERS);
            }
        }));
}

function scanHomeworkPromise(courseID, studentID) {
    const params = {
        TableName: 'CEDSI_STUDENT',
        Key: {
            USER_ID: studentID
        },
        ProjectionExpression: "HOMEWORKS"
    };
    return new Promise((resolve, reject) => dynamoDb
        .get(params, (err, data) => {
            if (err) {
                console.error(err);
                reject('Couldn\'t fetch the homework items.');
            }
            resolve(data.Item.HOMEWORKS);
        }));
}
function scanCreationsPromise(studentID) {
    const params = {
        TableName: 'CEDSI_STUDENT',
        Key: {
            USER_ID: studentID
        },
        ProjectionExpression: "PRODUCTIONS"
    };
    return new Promise((resolve, reject) => dynamoDb
        .get(params, (err, data) => {
            if (err) {
                console.error(err);
                reject('Couldn\'t fetch the creation items.');
                return;
            }
            resolve(data.Item.PRODUCTIONS);
        }));
}

function scanStudentProcessPromise(studentId, courseId) {
    var params = {
        TableName: 'CEDSI_STUDENT',
        Key: {
            USER_ID: studentId
        },
        ProjectionExpression: "COURSE_INFO"
    };
    return new Promise((resolve, reject) => dynamoDb
        .get(params, (err, data) => {
            if (err) {
                console.error(err);
                reject('Couldn\'t fetch the creation items.');
                return;
            }
            data.Item.COURSE_INFO.forEach(item => {
                if (item.COURSE_ID == courseId) {
                    resolve({
                        length: item.FINISH_CHAPTER.length,
                        time: item.CREATE_TIME
                    });
                }
            })
        }));
}

//================================== api ==================================
async function getStudentInfo(courseID, studentID) {

    const [chapters, homework, creations, learns] = await Promise.all([
        queryChapterPromise(courseID),
        scanHomeworkPromise(courseID, studentID),
        scanCreationsPromise(studentID),
        scanStudentProcessPromise(studentID, courseID)
    ]);
    const haveStarted = chapters.length;
    const starNum = homework.reduce((acc, work) => acc + ~~work.HW_RANK, 0);
    return {
        haveStarted: haveStarted,
        haveLearned: learns.length,
        homeworkNum: homework.length,
        chaptersNum: chapters.length,
        homeworkStars: starNum,
        creationNums: creations.length,
        joinTime: learns.time
    };
}

function get(courseId, id) {
    var params = {
        TableName: "CEDSI_CURRICULUMS",
        Key: {
            "ID": courseId
        }
    };
    return new Promise((resolve, reject) => dynamoDb.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            getStudentInfo(courseId, id).then(value => {
                data.Item.status = value;
                resolve(data.Item);
            });
        }

    }));
}

function getFore(id) {
    return new Promise(function (resolve, reject) {
        var params = {
            TableName: "CEDSI_STUDENT",
            Key: {
                USER_ID: id
            },
            ProjectionExpression: "COURSE_INFO"
        };

        dynamoDb.get(params, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                var courseIdList = [];

                for (var i = 0; i < data.Items.length; i++) {
                    courseIdList[i] = data.Items[i].COURSE_ID;
                }
                var courseList = [];
                var i0 = 0;
                courseIdList.forEach(async function (courseId) {
                    var r = await get(courseId, id);
                    r.CREATE_TIME = r.status.joinTime;
                    courseList.push(r);
                    i0++;
                    if (i0 == courseIdList.length) {
                        resolve(courseList);
                    }
                });
            }
        });
    });
}

function keysort(key, sortType) {
    return function (a, b) {
        return sortType ? (~~a[key] - ~~b[key]) : (~~a[key] - ~~b[key]);
    };
}
exports.handler = function (event, context, callback) {

    var id = event.principalId;
    getFore(id).then(function (data) {
        data = data.sort(keysort('CREATE_TIME', false));
        callback(null, data);
    });

};