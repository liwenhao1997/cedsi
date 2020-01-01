'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    var response = {};
    if (event.role != "2") {
        response.status = "fail";
        response.data = "非法访问";
        callback(response,null);
        return;
    }
    var class_id = event.class_id;
    var params = {
        TableName: 'CEDSI_STUDENT_HOMEWORK',
        IndexName: 'CLASS_ID',
        KeyConditionExpression: 'CLASS_ID = :id',
        ExpressionAttributeValues: {
            ':id': class_id
        },
        ProjectionExpression: "HW_ID,COURSE_NAME,CP_NAME,HW_DESCRIPTION,HW_GUIDE,HW_NAME,HW_RANK,HW_URL,STUDENT_ID,STUDENT_NAME,SUBMIT_TIME,TEACHER_REMARK"
    };
    docClient.query(params, function (err, data) {
        if (err) {
            console.error(JSON.stringify(err));
            callback(err, null);
        } else {
            response.status = "ok";
            response.data = data.Items;
            callback(null,response);
        }
    });
};