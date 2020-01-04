'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function disableTeacher(id) {
    var params = {
        TableName: 'CEDSI_TEACHER',
        Key: {
            TEACHER_ID: id
        },
        UpdateExpression: "SET TEACHER_STATUS = :status",
        ExpressionAttributeValues: {
            ":status": "disable"
        }
    };
    return new Promise((resolve, reject) => {
        docClient.update(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                response.err = err;
                response.status = "fail";
                reject(response);
            }
        });
    });
}
function getAccountCode(id) {
    var params = {
        TableName: 'AUTH_USER',
        Key: {
            USER_ID: id
        },
        ProjectionExpression: "ACCOUNT_ID"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Item);
            }
        });
    });
}
function getIndex(org_id, teacher_id) {
    var params = {
        TableName: "CEDSI_ORG",
        Key: {
            ORG_ID: org_id
        },
        ProjectionExpression: "TEACHERS"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                var index = 0;
                data.Item.TEACHERS.forEach(element => {
                    if (element.TEACHER_ID == teacher_id) {
                        resolve(index);
                    }
                    index++;
                });
            }
        });
    })
}
function disableUser(id) {
    var params = {
        TableName: 'AUTH_USER',
        Key: {
            USER_ID: id
        },
        UpdateExpression: "SET USER_STATUS = :status",
        ExpressionAttributeValues: {
            ":status": "disable"
        }
    };
    return new Promise((resolve, reject) => {
        docClient.update(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                reject(err);
            }
        });
    });
}
function disableOrgTeacher(org_id, teacher_id) {
    return new Promise((resolve, reject) => {
        getIndex(org_id, teacher_id).then(index => {
            var params = {
                TableName: 'CEDSI_ORG',
                Key: {
                    "ORG_ID": org_id
                },
                UpdateExpression: "REMOVE TEACHERS[:index]",
                ExpressionAttributeValues: {
                    ':index': index
                },
            };

            docClient.update(params, function (err, data) {
                if (err) {
                    console.error(JSON.stringify(err));
                    reject(err)
                }
            });
        });
    })
}
var response = {};
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));

    if (event.role != "3") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        response = {};
        return;
    }
    var id = event.teacher_id;
    getAccountCode(event.principalId).then(org_id => {
        disableOrgTeacher(org_id, teacher_id).then(() => {
            disableTeacher(id).then(() => {
                disableUser(id).then(() => {
                    callback(null, {
                        status: "ok"
                    });
                })
            })
        })
    }).catch(err => {
        console.error(JSON.stringify(err));
        callback(err);
    });
    
};
