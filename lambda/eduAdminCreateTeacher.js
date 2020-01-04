'use strict';
var AWS = require('aws-sdk');
var crypto = require('crypto');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function randomStr(len) {
    // isFinite 判断是否为有限数值
    if (!Number.isFinite(len)) {
        throw new TypeError('Expected a finite number');
    }
    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

function putUser(id, tid, secret, name, gender) {
    var salt = randomStr(32);
    secret = crypto.createHash('SHA256').update(secret + salt).digest('hex');
    var params = {
        TableName: 'AUTH_USER',
        Item: {
            "CREATE_TIME": Date.now(),
            "PASSWORD": secret,
            "ROLE_ID": "2",
            "SALT": salt,
            "USER_ID": id,
            "USER_NAME": tid,
            "USER_STATUS": "active",
            "USER_INFO": {
                "AVATAR": "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/default_avatar.png",
                "CREATE_TIME": Date.now(),
                "EMAIL": "example@qq.com",
                "GENDER": gender,
                "NICK_NAME": name,
                "PHONE": "12345678900"
            }
        }
    };

    return new Promise((resolve, reject) => {
        docClient.put(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                console.log(data);
                resolve(data);
            }
        });
    });
}

function putTeacher(code, id, name, teacher_id, intro, gender) {
    var params = {
        TableName: 'CEDSI_TEACHER',
        Item: {
            "GENDER": gender,
            "INTRO": intro,
            "ORG_ID": code,
            "RANK": "1",
            "TEACHER_ID": id,
            "TEACHER_NAME": name,
            "JOB_NUMBER": teacher_id,
            "TEACHER_STATUS": "active"
        }
    };
    docClient.put(params, function (err, data) {
        if (err) {
            console.error(JSON.stringify(err));
        } else {
            console.log(data);
        }
    });
}
function getAccountCode(id) {
    console.log(id);
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
                console.log(JSON.stringify(err));
                reject("err1");
            } else {
                var result = {};
                var org_id = data.Item.ACCOUNT_ID;
                var p = {
                    TableName: 'CEDSI_ORG',
                    Key: {
                        ORG_ID: org_id
                    },
                    ProjectionExpression: "ORG_NUMBER"
                };
                docClient.get(p, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        result.org_id = org_id;
                        result.number = data.Item.ORG_NUMBER;
                        resolve(result);
                    }
                });
            }
        });
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
    var teacher_id = event.teacher_id;   //教师工号
    var teacher_name = event.teacher_name;     //教师名字
    var secret = event.secret;
    var id = event.principalId;
    var intro = event.intro;
    var gender = event.gender;

    getAccountCode(id).then(data => {
        var user_id = data.number + teacher_id;    //账号ID
        var sha256 = crypto.createHash('SHA256');
        sha256.update(user_id);
        var tid = sha256.digest('hex'); //加密后的值, 用户ID

        putUser(tid, user_id, secret, teacher_name, gender);
        putTeacher(data.org_id, tid, teacher_name, teacher_id, intro, gender);
        callback(null, {
            status: "ok"
        });
    }).catch(err => {
        callback(err, null);
    });
};
