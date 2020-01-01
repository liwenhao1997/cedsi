'use strict';
var AWS = require('aws-sdk');
var uuid = require('uuid');
AWS.config = new AWS.Config({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;
var sts = new AWS.STS();

function createId() {
    var str = uuid.v4().replace(/-/g, "");
    var length = str.length;
    var newStr = "";
    for (var x = 0; x < 10; x++) {
        var num = Math.floor(Math.random() * length);
        newStr = newStr + str.charAt(num);
    }
    return newStr;
}

function addNumber() {
    var params = {
        TableName: 'CEDSI_ORG',
        ProjectionExpression: "ORG_NUMBER"
    };
    return new Promise((resolve, reject) => {
        docClient.scan(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                var max = 0;
                var i = 0;
                if (data.Items.length == 0) {
                    max++;
                    max = String(max).length == 1 ? "00" + max : "0" + max;
                    resolve(max);
                }
                data.Items.forEach(item => {
                    i++;
                    if (~~item.ORG_NUMBER > max) {
                        max = ~~item.ORG_NUMBER;
                    }
                    if (i == data.Items.length) {
                        max++;
                        max = String(max).length == 1 ? "00" + max : "0" + max;
                        resolve(max);
                    }
                });
            }
        });
    });
}

function getToken() {
    var params = {
        DurationSeconds: 3600,
        Policy: "{\"Version\": \"2012-10-17\",\"Statement\": [{\"Sid\": \"VisualEditor0\",\"Effect\": \"Allow\",\"Action\": [\"s3:PutObject\",\"s3:PutBucketTagging\",\"s3:PutBucketAcl\",\"s3:PutBucketPolicy\",\"s3:PutObjectTagging\",\"s3:PutObjectAcl\"],\"Resource\": \"*\"}]}",
        RoleArn: "arn:aws-cn:iam::202976975702:role/IamSTSFullAccess",
        RoleSessionName: "Bob"
    };
    return new Promise((resolve, reject) => {
        sts.assumeRole(params, function (err, data) {
            if (err) reject(err, err.stack); // an error occurred
            else resolve(data);
        });
    });
}
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    if (event.role != "4") {
        var response = {};
        response.status = "fail";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var org_name = event.org_name;
    var head_master = event.head_master;
    var org_addr = event.org_addr;
    var intro = event.intro;
    var type = event.org_type;
    var code = event.code;
    addNumber().then(number => {
        var buf1 = Buffer.alloc(30, 16);
        buf1.write(org_name + code + Date.now());
        code = buf1.toString("base64");
        //var short_name = event.short_name;
        var license_type = event.type;
        var url = createId();
        var license = "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/license/" + url + "." + license_type;

        var id = createId();
        
        var params = {
            TableName: 'CEDSI_ORG',
            Item: {
                "ORG_ID": id,
                "HEADMASTER": head_master,
                "INTRODUCTION": intro,
                "ORG_CODE": code,
                "ORG_LOCATION": org_addr,
                "ORG_NAME": org_name,
                "ORG_TYPE": type,
                //"SHORT_NAME": short_name,
                "BUSINESS_LICENSE": license,
                "ORG_NUMBER": number
            }
        };
        
        docClient.put(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                callback(null, {
                    status: error
                })
            } else {
                getToken().then(res => {
                    res.Credentials.id = url;
                    callback(null, res.Credentials);
                });
            }
        });
    });

};