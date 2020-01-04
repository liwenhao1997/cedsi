'use strict';
var AWS = require("aws-sdk");

AWS.config.update({
  region: "cn-northwest-1",
});

var docClient = new AWS.DynamoDB.DocumentClient;
var sts = new AWS.STS();

function update_name(studentId,name) {
    var params = {
        TableName: "AUTH_USER",
        Key: {
            "USER_ID":studentId
        },
        UpdateExpression: "SET USER_INFO.NICK_NAME = :name",
        ExpressionAttributeValues: {
            ":name": name
        }
    };

    return new Promise((resolve,reject) => {
        docClient.update(params,function(err,data){
        if(err){
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            reject(0);
        }else{
            resolve(1);
        }
    });
    });
}

function update_gender(studentId,gender) {
    var params = {
        TableName: "AUTH_USER",
        Key: {
            "USER_ID":studentId
        },
        UpdateExpression: "SET USER_INFO.GENDER = :gender",
        ExpressionAttributeValues: {
            ":gender": gender
        }
    };

    return new Promise((resolve,reject) => {
        docClient.update(params,function(err,data){
        if(err){
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            reject(0);
        }else{
            resolve(1);
        }
    });
    });
}
function update_email(studentId,email) {
    var params = {
        TableName: "AUTH_USER",
        Key: {
            "USER_ID":studentId
        },
        UpdateExpression: "SET USER_INFO.EMAIL = :email",
        ExpressionAttributeValues: {
            ":email": email
        }
    };

    return new Promise((resolve,reject) => {
        docClient.update(params,function(err,data){
        if(err){
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            reject(0);
        }else{
            resolve(1);
        }
    });
    });
}

function update_phone(studentId, phone) {
    var params = {
        TableName: "AUTH_USER",
        Key: {
            "USER_ID": studentId
        },
        UpdateExpression: "SET USER_INFO.PHONE = :phone",
        ExpressionAttributeValues: {
            ":phone": phone
        }
    };

    return new Promise((resolve, reject) => {
        docClient.update(params, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                reject(0);
            } else {
                resolve(1);
            }
        });
    });
}

function update_avatar(studentId, url) {
    var params = {
        TableName: "AUTH_USER",
        Key: {
            "USER_ID": studentId
        },
        UpdateExpression: "SET USER_INFO.AVATAR = :url",
        ExpressionAttributeValues: {
            ":url": url
        }
    };

    return new Promise((resolve, reject) => {
        docClient.update(params, function (err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                reject(0);
            } else {
                resolve(1);
            }
        });
    });
}
function getToken() {
    var params = {
        DurationSeconds: 900,
        Policy: "{\"Version\": \"2012-10-17\",\"Statement\": [{\"Sid\": \"VisualEditor0\",\"Effect\": \"Allow\",\"Action\": [\"s3:PutObject\",\"s3:PutBucketTagging\",\"s3:PutBucketAcl\",\"s3:PutBucketPolicy\",\"s3:PutObjectTagging\",\"s3:PutObjectAcl\"],\"Resource\": \"*\"}]}",
        RoleArn: "arn:aws-cn:iam::202976975702:role/IamSTSFullAccess",
        RoleSessionName: "Bob"
    };
    return new Promise((resolve, reject) => {
        sts.assumeRole(params, function (err, data) {
            if (err) reject(err, err.stack); 
            else {
                resolve(data);
            }
        });
    });
}

exports.handler = async function(event, context, callback) {
    console.log(JSON.stringify(event));
    var response = {};
    var student_id = event.principalId;
    var s = 0;
    if(event.student_name){
        s = await update_name(student_id,event.student_name);
    }
    if(event.email){
        await update_email(student_id,event.email).then(data => {
            s = data;
        });
    }
    if(event.gender){
        await update_gender(student_id,event.gender).then(data => {
            s = data;
        });
    }
    if(event.phone){
        await update_phone(student_id,event.phone).then(data => {
            s = data;
        });
    }
    if(event.type){
        var url = "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/user/avatar/" + student_id + "." + event.type;
        await update_avatar(student_id,url).then(async data => {
            s = data;
            await getToken().then(data => {
                data.Credentials.id = student_id;
                response = data.Credentials;
            });
            
        });
    }
    
    if(s === 1) {
        callback(null, response);
    } else {
        callback("error",null);
    }
};