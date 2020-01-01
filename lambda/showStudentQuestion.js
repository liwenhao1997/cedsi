'use strict';
var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();

function getTeacherMsg(id) {
    var params = {
        TableName: "USER_INFO",
        KeyConditionExpression: "USER_ID = :id",
        ExpressionAttributeValues: {
            ":id": id
        },
        ProjectionExpression: "NICK_NAME,AVATAR"
    };
    return new Promise((resolve,reject) => {
        docClient.query(params,function(err,data){
        if(err){
            console.log("table info:",params);
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            reject(err);
        }else{
            console.log(data.Items);
            resolve(data.Items);
        }
    });
    });
}

exports.handler = (event, context, callback) => {
    var id = event.principalId;
    // 创作空间
    var params = {
        TableName: "CEDSI_STUDENT_QUESTION",
        IndexName: "STUDENT_ID",
        KeyConditionExpression: "STUDENT_ID = :id",
        ExpressionAttributeValues: {
            ":id": id
        },
        ProjectionExpression: "QUESTION_CONTENT,ANSWER_CONTENT,CREATE_TIME,TEACHER_ID"
    };

    // 表扫描
    docClient.query(params, (err, data) => {
        if (err) {
            callback(JSON.stringify(err));
        } else {
            var i = 0;
            var r = data.Items;
            data.Items.forEach(function(item) {
                getTeacherMsg(item.TEACHER_ID).then(data => {
                    r[i].AVATAR = data[0].USER_INFOAVATAR;
                    r[i].NICK_NAME = data[0].NICK_NAME;
                    delete r[i].TEACHER_ID;
                    i++;
                    if(i == r.length) {
                        callback(null,r)
                    }
                })
            })
        }
    });
};
