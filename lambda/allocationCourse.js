'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function updateHistory(id, course_id, course_name, member_count,teacher_id) {
    var data = {
        "ID": course_id,
        "MEMBER_COUNT": member_count,
        "NAME": course_name,
        "TEACHER": teacher_id
    };
    var params = {
        TableName: 'CEDSI_CLASS',
        Key: {
            CLASS_ID: id
        },
        UpdateExpression: "SET HISTORY_COURSE = list_append(if_not_exists(HISTORY_COURSE, :empty_object), :data)",
        ExpressionAttributeValues: {
            ":empty_object": [],
            ":data": [data]
        }
    };

    docClient.update(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
        } else {
            console.log(data);
        }
    });
}

function getClassMsg(id) {
    var params = {
        TableName: 'CEDSI_CLASS',
        Key: {
            CLASS_ID: id
        },
        ProjectionExpression: "CLASS_MEMBER_COUNT,COURSE_NAME,COURSE_ID,TEACHER_ID"
    };

    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(JSON.stringify(err));
            } else {
                resolve(data.Item);
            }
        });
    });
}

function updateCourseMsg(class_id, course_id, course_name,teacher_id) {
    var params = {
        TableName: 'CEDSI_CLASS',
        Key: {
            CLASS_ID: class_id
        },
        UpdateExpression: "SET COURSE_ID = :cid , COURSE_NAME = :cname , CLASS_MEMBER_COUNT = :count, TEACHER_ID = :teacher",
        ExpressionAttributeValues: {
            ":cid": course_id,
            ":cname": course_name,
            ":count": 0,
            ":teacher": teacher_id
        }
    };

    docClient.update(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
        } else {
            console.log(data);
        }
    });
}
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var response = {};
    if (event.role != "3") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var class_id = event.class_id;
    var course_id = event.course_id;
    var course_name = event.course_name;
    var teacher_id = event.teacher_id;
    getClassMsg(class_id).then(async class_data => {
        await updateHistory(class_id, class_data.COURSE_ID, class_data.COURSE_NAME, class_data.CLASS_MEMBER_COUNT, class_data.TEACHER_ID);
        await updateCourseMsg(class_id, course_id, course_name,teacher_id);
        callback(null, "ok");
    });
};