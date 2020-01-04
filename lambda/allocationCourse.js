'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function updateHistory(org_id, class_id, course_id, course_name, member_count,teacher_id) {
    getIndex(org_id, class_id).then(index => {
        var data = {
            "ID": course_id,
            "MEMBER_COUNT": member_count,
            "NAME": course_name,
            "TEACHER": teacher_id
        };
        var params = {
            TableName: 'CEDSI_ORG',
            Key: {
                ORG_ID: org_id
            },
            UpdateExpression: "SET ORG_CLASSES[:index].HISTORY_COURSE = list_append(if_not_exists(ORG_CLASSES[:index].HISTORY_COURSE, :empty_object), :data)",
            ExpressionAttributeValues: {
                ":empty_object": [],
                ":data": [data]
            }
        };
    
        docClient.update(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
            } 
        });
    })
}

function getClassMsg(org_id, class_id) {
    var params = {
        TableName: 'CEDSI_ORG',
        Key: {
            ORG_ID: org_id
        },
        ProjectionExpression: "ORG_CLASSES"
    };

    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(JSON.stringify(err));
            } else {
                data.Item.ORG_CLASSES.forEach(item => {
                    if (item.CLASS_ID == class_id) {
                        resolve(item);
                    }
                })
            }
        });
    });
}

function getOrgId(id) {
    return new Promise((resolve, reject) => {
        var params = {
            TableName: "AUTH_USER",
            Key: {
                USER_ID: id
            },
            ProjectionExpression: "ACCOUNT_ID"
        };
        docClient.get(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                reject(err);
            } else {
                resolve(data.Item.ACCOUNT_ID)
            }
        })
    })
}

function getIndex(org_id,class_id) {
    var params = {
        TableName: "CEDSI_ORG",
        Key: {
            ORG_ID: org_id
        },
        ProjectionExpression: "ORG_CLASSES"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                var index = 0;
                data.Item.ORG_CLASSES.forEach(element => {
                    if (element.CLASS_ID == class_id) {
                        resolve(index);
                    }
                    index++;
                });
            }
        });
    })
}

function updateCourseMsg(org_id,class_id, course_id, course_name,teacher_id) {
        getIndex(org_id, class_id).then(index => {
            var params = {
                TableName: 'CEDSI_ORG',
                Key: {
                    ORG_ID: org_id
                },
                UpdateExpression: "SET ORG_CLASSES[:index].COURSE_ID = :cid , ORG_CLASSES[:index].COURSE_NAME = :cname , ORG_CLASSES[:index].CLASS_MEMBER_COUNT = :count, ORG_CLASSES[:index].TEACHER_ID = :teacher",
                ExpressionAttributeValues: {
                    ":index": index,
                    ":cid": course_id,
                    ":cname": course_name,
                    ":count": 0,
                    ":teacher": teacher_id
                }
            };
        
            docClient.update(params, function (err, data) {
                if (err) {
                    console.log(JSON.stringify(err));
                }
            });
    })
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
    getOrgId(event.principalId).then(org_id => {
        getClassMsg(org_id, class_id).then(class_data => {
            updateHistory(org_id,class_id, class_data.COURSE_ID, class_data.COURSE_NAME, class_data.CLASS_MEMBER_COUNT, class_data.TEACHER_ID);
            updateCourseMsg(org_id,class_id, course_id, course_name, teacher_id);
            callback(null, {
                status: "ok"
            });
        });
    })
    
};