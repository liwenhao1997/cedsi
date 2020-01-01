'use strict';
var AWS = require('aws-sdk');
var uuid = require('uuid');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;
var sts = new AWS.STS();
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
    if (event.role != "4") {
        var response = {};
        response.status = "fail";
        response.err = "非法访问";
        callback(response,null);
        return;
    }
    var founder_id = event.principalId;
    var introduction = event.introduction;
    var name = event.name;
    var type = event.type;
    var course_id = uuid.v4().substr(0, 8);
    var price = event.price;
    var cover = "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/course/" + course_id + "." + type;
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        Item: {
            "ID": course_id,
            "COVER": cover,
            "INTRO": introduction,
            "COURSE_NAME": name,
            "FOUNDER": founder_id,
            "CREATE_TIME": Date.now(),
            "PRICE": price,
            "COURSE_STATUS": "NOT_PUBLISH"
        }
    };

    docClient.put(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
        } else {
            getToken().then(data => {
                data.Credentials.id = course_id;
                callback(null, data.Credentials);
            });
        }
    });
};