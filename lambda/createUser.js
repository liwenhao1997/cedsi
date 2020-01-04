'use strict';
var AWS = require("aws-sdk");
var crypto = require('crypto');  //加载crypto库


var docClient = new AWS.DynamoDB.DocumentClient;

function randomStr(len) {
        // isFinite 判断是否为有限数值
    if (!Number.isFinite(len)) {
        throw new TypeError('Expected a finite number');
    }

    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var response = {};
    if(event.role != "5") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response,null);
        return;
    }
    var username = event.username;
    var password = event.password;
    var salt = randomStr(32);
    password=crypto.createHash('SHA256').update(password + salt).digest('hex');
    var ROLE_ID = "4";

    var sha256 = crypto.createHash('sha256');//定义加密方式:md5不可逆,此处的sha256可以换成任意hash加密的方法名称；
    sha256.update(username);
    var userID = sha256.digest('hex');  //加密后的值
    var params = {
        TableName : "AUTH_USER",
        Item: {
            "USER_ID": userID,
            "USER_NAME": username,
            "PASSWORD": password,
            "CREATE_TIME": String(Date.now()),
            "ROLE_ID": ROLE_ID,
            "SALT": salt,
            "USER_STATUS": "active",
            "USER_INFO": {
                "AVATAR": "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/default_avatar.png",
                "NICK_NAME": username,
                "EAMIL": "example@qq.com",
                "GENDER": "1",
                "PHONE": "12345678900",
                "UPDATE_TIME": String(Date.now())
            }
        }
    };
    docClient.put(params,function(err,data){
        if(err){
            console.error(err);
            response.status = "fail";
            response.err = err;
            callback(response,null);
        }else{
            response.status = "ok";
            callback(null,response);
        }
    });
};



