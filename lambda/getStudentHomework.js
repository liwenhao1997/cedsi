'use strict';
var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

const docClient = new AWS.DynamoDB.DocumentClient();

function getHomework(studentId, course_id) {
    var homework = {
        TableName: 'CEDSI_STUDENT_HOMEWORK',
        IndexName: "STUDENT_ID",
        ProjectionExpression: "HW_ID, HW_NAME, HW_COVER, HW_URL, SUBMIT_TIME,TEACHER_REMARK,HW_RANK,HW_GUIDE",
        KeyConditionExpression: "STUDENT_ID = :stuId",
        FilterExpression: "COURSE_ID = :cid",
        ExpressionAttributeValues: {
            ":stuId": studentId,
            ":cid": course_id
        }
    };

    // 表扫描
    return new Promise((resolve, reject) => {
        docClient.query(homework, function (err, data) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(data.Items);
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