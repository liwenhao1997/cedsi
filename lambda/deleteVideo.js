'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function updateResource(id) {
    var params = {
        TableName: 'CEDSI_CHAPTERS',
        Key: {
            CP_ID: id
        },
        UpdateExpression: "SET CP_RESOURCE.VIDEO = :empty",
        ExpressionAttributeValues: {
            ":empty": {}
        }
    };

    return new Promise((resolve, reject) => {
        docClient.update(params, function (err, data) {
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

// function getResource(id) {
//     var params = {
//         TableName: 'CEDSI_CHAPTERS',
//         Key: {
//             CP_ID: id
//         }
//     };
//     return new Promise((resolve, reject) => {
//         docClient.get(params, function (err, data) {
//             if (err) {
//                 console.log(JSON.stringify(err));
//                 reject(err);
//             } else {
//                 console.log(data);
//                 resolve(data.Item);
//             }
//         });
//     });
// }

function getUrl(id) {
    var params = {
        TableName: 'CEDSI_RESOURCE',
        Key: {
            RS_ID: id
        },
        ProjectionExpression: "RS_URL"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                console.log(data);
                var arr = data.Item.RS_URL.split(".cn/");
                resolve(arr[arr.length - 1]);
            }
        });
    });
}

function deleteRS(id) {
    var params = {
        TableName: 'CEDSI_RESOURCE',
        Key: {
            RS_ID: id
        }
    };
    return new Promise((resolve, reject) => {
        docClient.delete(params, function (err, data) {
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

function deleteVideo(key) {
    var s3 = new AWS.S3();
    var params = {
        Bucket: "cedsi",
        Key: key
    };
    return new Promise((resolve, reject) => {
        s3.deleteObject(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            } 
            else {
                console.log(data); 
                resolve(data);
            }
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
    var cp_id = event.cp_id;
    var rs_id = event.rs_id;
    updateResource(cp_id);
    getUrl(rs_id).then(data => {
        deleteRS(rs_id);
        deleteVideo(data);
        callback(null, {status: "ok"});
    }).catch(err => {
        callback(err, null);
    });
};