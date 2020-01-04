'use strict';
var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

const docClient = new AWS.DynamoDB.DocumentClient();

function getHomework(studentId, course_id) {
    var homework = {
        TableName: 'CEDSI_STUDENT',
        Key: {
            USER_ID: studentId
        },
        ProjectionExpression: "HOMEWORKS"
    };

    // 表扫描
    return new Promise((resolve, reject) => {
        docClient.get(homework, function (err, data) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                data.Item.HOMEWORKS.forEach(item => {
                    if (item.COURSE_ID == course_id) {
                        resolve(item);
                    }
                })
            }
        });
    });
}
// 对外暴露处理函数
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var course_id = event.course_id;
    var student_id = event.principalId;
    var result = {};
    getHomework(student_id, course_id).then(function (data) {
        result.homework = data;
        result.status = 'ok';
        callback(null, result);
    });
};