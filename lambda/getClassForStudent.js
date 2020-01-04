var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();

function getClassMsg(org_id, class_id) {
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
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                reject(err);
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

function getTeacherName(id) {
    var params = {
        TableName: "AUTH_USER",
        Key: {
            USER_ID: id
        },
        ProjectionExpression: "USER_INFO.NICK_NAME,USER_INFO.AVATAR"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                resolve(data.Item);
            }
        });
    });
}

function getData(class_id,org_id,student_id) {
    var result = {};
    return new Promise((resolve, reject) => {
        getClassMsg(class_id).then(data => {
                result.className = data.CLASS_NAME;
                result.member_count = data.CLASS_MEMBER_COUNT;
                return getTeacherName(data.TEACHER_ID);
            }).then(data => {
                result.teacher = {};
                result.teacher.teacher_name = data.USER_INFO.NICK_NAME;
                result.teacher.avatar = data.USER_INFO.AVATAR;
                var params = {
                    TableName: "CEDSI_STUDENT",
                    IndexName: "ORG_ID",
                    KeyConditionExpression: "ORG_ID = :id",
                    FilterExpression: "contains(CLASSES, :class_id)",
                    ExpressionAttributeValues: {
                        ":id": org_id,
                        ":class_id": class_id
                    },
                    ProjectionExpression: "STUDENT_INFO"
                };
                docClient.query(params, function (err, data) {
                    if (err) {
                        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                        reject(err);
                    } else {
                        result.classmates = data.Items;
                        for (var i = 0; i < result.classmates.length; i++) {
                            var ids = result.classmates[i].USER_ID;
                            if (ids == student_id) {
                                result.classmates.splice(i, 1);
                                i--;
                                continue;
                            }
                            delete result.classmates[i].USER_ID;
                        }
                        resolve(result);
                    }

                });
            });
    });
}
exports.handler = (event, context, callback) => {
    var class_id = "";
    var student_id = event.principalId;
    var params = {
        TableName: "CEDSI_STUDENT",
        Key: {
            USER_ID: student_id
        },
        ProjectionExpression: "CLASSES,ORG_ID"
    };
    var result = [];
    docClient.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            callback(err, null);
        } else {
            var l = data.Item.CLASSES.length;
            var org_id = data.Item.ORG_ID;
            data.Item.CLASSES.every(async item => {
                class_id = item.CLASS_ID;
                if (class_id.length<=4) {
                    l--;
                    if(result.length == l) {
                        callback(null,result);
                    }
                    return false;
                }
                var r = await getData(class_id,org_id,student_id);
                result.push(r);
                if(result.length == l) {
                    callback(null,result);
                }
            });
            
        }
    });
};