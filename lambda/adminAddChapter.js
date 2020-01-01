'use strict';
var AWS = require('aws-sdk');
var uuid = require('uuid');
AWS.config = new AWS.Config({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    if (event.role != "4") {
        var response = {};
        response.status = "fail";
        response.err = "非法访问";
        callback(response,null);
        return;
    }
    var course_id = event.course_id;
    var description = event.description;
    var founder = event.principalId;
    var name = event.name;
    var num = event.num;

    var id = uuid.v4();
    var chapter = {
        "CP_DESCRIPTION": description,
        "CP_FOUNDER": founder,
        "CP_ID": id,
        "CP_NAME": name,
        "CP_NUMBER": num,
        "CP_UPLOAD_TIME": Date.now()
    };
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        Key: {
            ID: course_id
        },
        UpdateExpression: 'SET CHAPTERS = list_append(if_not_exists(CHAPTERS, :empty_object), :chapter)',
        ExpressionAttributeValues: {
            ":empty_object": [],
            ":chapter": chapter
        }
      };

    docClient.update(params, function (err, data) {
        if (err) {
            console.error(JSON.stringify(err));
            callback(err, {
                status: error
            });
        } else {
            callback(null, {
                status: "ok"
            })
        }
    });
};