'use strict';
var AWS = require('aws-sdk');
var uuid = require('uuid');
AWS.config = new AWS.Config({
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
    console.log(JSON.stringify(event));
    if(event.role != "4") {
        var response = 
        response.status = "fail";
        response.err = "非法访问";
        callback(response,null);
        return;
    }
    var founder_id = event.principalId;
    var course_id = event.course_id;
    var comment = event.comment;
    var video_name = event.video_name;
    var type = event.type;
    var size = event.size;
    var chapter_id = event.chapter_id;
    
    var video_id = uuid.v4().substr(0,10);
    var rs_id = course_id + "-" + video_id;
    var url = "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/course/video/" + rs_id + "." + type;
    
    var params = {
        TableName: 'CEDSI_RESOURCE',
        Item: {
            "RS_ID": rs_id,
            "RS_COMMENT": comment,
            "RS_SIZE": size,
            "RS_TYPE": type,
            "RS_NAME": video_name,
            "RS_FOUNDER": founder_id,
            "RS_CREATE_TIME": String(Date.now()),
            "RS_URL": url
        }
    };

    docClient.put(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
        } else {
            var params0 = {
            TableName: 'CEDSI_CHAPTERS',
            UpdateExpression: 'set CP_RESOURCE = :location',
            ExpressionAttributeValues: {
                ':location': {"VIDEO": rs_id}
            },
            Key: {
                "CP_ID": chapter_id
            }
        };
        docClient.update(params0, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
            } else {
                getToken().then(data => {
                    data.Credentials.id = rs_id;
                    callback(null,data.Credentials);
                });
            }
        });
        }
    });
};
