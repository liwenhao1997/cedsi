'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

// function getActivityMsg(id) {
//     console.log(id)
//     var params = {
//         TableName: "CEDSI_ACTIVITY",
//         Key: {
//             ID: id
//         },
//         ProjectionExpression: "VIDEOS"
//     };
//     return new Promise((resolve, reject) => {
//         docClient.get(params, function(err, data) {
//             if (err) {
//                 console.error(JSON.stringify(err));
//                 reject(err);
//             } else {
//                 resolve(data.Item);
//             }
//         });
//     });
// }
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var id = event.open_id;
    var params = {
        TableName: 'OFFLINE_ACTIVITY_MESSAGE',
        KeyConditionExpression: 'OPEN_ID = :id',
        ExpressionAttributeValues: {
            ':id': id
        },
    };

    docClient.query(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err, null);
        } else {
            // var result = [];
            // // var i = 0;
            // data.Items.forEach(item => {
            //     getActivityMsg(item.ACTIVITY_ID).then(res => {
            //         item.VIDEOS = res;
            //         result.push(item);
            //         if(result.length == data.Items.length) {
            //             callback(null, result);
            //         }
            //     });
            // });
            callback(null, data.Items);
        }
    });
};

