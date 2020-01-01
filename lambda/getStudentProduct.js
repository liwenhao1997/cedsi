'use strict';
var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

const docClient = new AWS.DynamoDB.DocumentClient();

function getProduct(studentId) {
    var params = {
        TableName: 'CEDSI_STUDENT_PRODUCTION',
        IndexName: "STUDENT_ID",
        KeyConditionExpression: "STUDENT_ID = :stuId",
        ProjectionExpression: "PRODUCT_ID, PRODUCT_NAME, COVER_URL, VIEW_COUNT, CREATE_TIME,TEACHER_REMARK,PRODUCT_RANK,DESCRIPTION,LICENSE",
        ExpressionAttributeValues: {
            ":stuId": studentId
        }
    };

    return new Promise((resolve, reject) => {
        docClient.query(params, function (err, data) {
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
    var studentId = event.principalId;
    var result = {};
    getProduct(studentId).then(function (data) {
        result.product = data;
        result.status = 'ok';
        callback(null, result);
    });
};