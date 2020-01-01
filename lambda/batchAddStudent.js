'use strict';
var AWS = require('aws-sdk');
var crypto = require('crypto');
AWS.config = new AWS.Config({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

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
                console.log(JSON.stringify(err));
                reject("err1");
            } else {
                var result = {};
                var code = data.Item.ACCOUNT_ID;
                var p = {
                    TableName: 'CEDSI_ORG',
                    IndexName: "ORG_CODE",
                    KeyConditionExpression: 'ORG_CODE = :id',
                    ExpressionAttributeValues: {
                        ':id': code
                    },
                    ProjectionExpression: "ORG_NUMBER"
                };
                docClient.query(p, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        result.code = code;
                        result.number = data.Items[0].ORG_NUMBER;
                        // result.courses = data.Items[0].AUTHORIZATION_COURSES;
                        resolve(result);
                    }
                });
            }
        });
    });
}

var now = Date.now();
var AUTH_USER = [];
var USER_INFO = [];
var CEDSI_STUDENT = [];
var avatar = "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/default_avatar.png";

function randomStr(len) {
        // isFinite 判断是否为有限数值
    if (!Number.isFinite(len)) {
        throw new TypeError('Expected a finite number');
    }
    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

function build_AUTH_USER(element) {
    var template = {};
    template.PutRequest = {};
    var salt = randomStr(32);
    var password=crypto.createHash('SHA256').update(element.password).digest('hex');
    password = crypto.createHash('SHA256').update(password + salt).digest('hex');
    
    var item = {
        "USER_ID": element.user_id,
        "CREATE_TIME": now,
        "PASSWORD": password,
        "ROLE_ID": "1",
        "SALT": salt,
        "USER_NAME": element.username,
        "USER_STATUS": "active"
        // "USER_INFO": {
        //     "EMAIL": "example@qq.com",
        //     "GENDER": element.gender,
        //     "NICK_NAME": element.name,
        //     "PHONE": element.phone,
        //     "AVATAR": avatar,
        //     "UODATE_TIME": now
        // }
    };
    template.PutRequest.Item = item;
    AUTH_USER.push(template);
}

function build_USER_INFO(element) {
    var template = {};
    template.PutRequest = {};
    var item = {
        "USER_ID": element.user_id,
        "CREATE_TIME": now,
        "GENDER": element.gender,
        "ROLE_ID": "1",
        "MOBILE": element.mobile == "" ? "无" : element.mobile,
        "NICK_NAME": element.name,
        "PHONE": element.phone,
        "AVATAR": avatar
    };
    template.PutRequest.Item = item;
    USER_INFO.push(template);
}

function build_CEDSI_STUDENT(element, class_id) {
    var template = {};
    template.PutRequest = {};
    var item = {
        "AGE": element.age,
        "AVATAR": avatar,
        "CLASS_ID": class_id,
        "GENDER": element.gender,
        "MOBILE_PHONE": element.phone == "" ? "无":element.phone,
        "ORG_ID": element.account_id,
        "STUDENT_ID": element.id,
        "STUDENT_NAME": element.name,
        "USER_ID": element.user_id,
        "GRADE": element.grade
    };
    template.PutRequest.Item = item;
    CEDSI_STUDENT.push(template);
}

function build(data,number , account_id, class_id) {
    var i = 0;
    return new Promise((resolve, reject) => {
        data.forEach(function (element) {
            element.account_id = account_id;
            element.gender = element.gender == '男' ? '1' : '0';
            element.username = number + element.id;
            var md5 = crypto.createHash('md5');
            md5.update(element.username);
            element.user_id = md5.digest('hex'); //加密后的值
            build_AUTH_USER(element);
            build_USER_INFO(element);
            build_CEDSI_STUDENT(element, class_id);
            i++;
            if (i == data.length) {
                resolve("1");
            }
        });
    });
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var response = {};
    if(event.role != "3") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response,null);
        response = {};
        return;
    }
    var students_data = event.sheet;
    // var class_id = event.class_id;
    var  number, account_id;
    var id = event.principalId;
    
    students_data.splice(0, 1);

    getAccountCode(id).then(data => {
        number = data.number;
        account_id = data.code;
        // class_id = data.code;
        build(students_data, number,account_id, number).then(data => {
            if (data == "1") {
                var params = {
                    RequestItems: {
                        'AUTH_USER': AUTH_USER,
                        'USER_INFO': USER_INFO,
                        'CEDSI_STUDENT': CEDSI_STUDENT
                    }
                };
                docClient.batchWrite(params, function (err, data) {
                    if (err) {
                        console.log(JSON.stringify(err));
                        response.status = "fail";
                        response.err = err;
                        callback(response, null);
                    } else {
                        console.log("222222");
                        console.log(data);

                        response.status = "ok";
                        response.data = data;
                        callback(null, response);
                        now = Date.now();
                        AUTH_USER = [];
                        USER_INFO = [];
                        CEDSI_STUDENT = [];
                    }
                });
            } else {
                callback("err", null);
            }

        });
    });
};