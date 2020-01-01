var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();

function getClassMsg(class_id) {
    var params = {
        TableName: "CEDSI_CLASS",
        KeyConditionExpression: "CLASS_ID = :cid",
        ExpressionAttributeValues: {
            ":cid": class_id
        },
        ProjectionExpression: "CLASS_NAME,TEACHER_ID,CLASS_MEMBER_COUNT"
    };
    return new Promise((resolve, reject) => {
        docClient.query(params, function (err, data) {
            if (err) {
                console.log("table info:", params);
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                resolve(data.Items[0]);
            }
        });
    });
}

function getTeacherName(id) {
    var params = {
        TableName: "USER_INFO",
        KeyConditionExpression: "USER_ID = :id",
        ExpressionAttributeValues: {
            ":id": id
        },
        ProjectionExpression: "NICK_NAME,AVATAR"
    };
    return new Promise((resolve, reject) => {
        docClient.query(params, function (err, data) {
            if (err) {
                console.log("table info:", params);
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                resolve(data.Items[0]);
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
                    IndexName: "CLASS_ID",
                    KeyConditionExpression: "CLASS_ID = :id",
                    FilterExpression: "ORG_ID = :org",
                    ExpressionAttributeValues: {
                        ":id": class_id,
                        ":org": org_id
                    },
                    ProjectionExpression: "AVATAR,STUDENT_NAME,AGE,GENDER,USER_ID"
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
    var params0 = {
        TableName: "CEDSI_STUDENT",
        KeyConditionExpression: "USER_ID = :Uid",
        ExpressionAttributeValues: {
            ":Uid": student_id
        },
        ProjectionExpression: "CLASS_ID,ORG_ID"
    };
    var result = [];
    docClient.query(params0, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            callback(err, null);
        } else {
            var l = data.Items.length;
            data.Items.every(async item => {
                class_id = item.CLASS_ID;
                var org_id = item.ORG_ID;
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