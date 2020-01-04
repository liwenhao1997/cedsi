'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function getActivityDetail(activity_id) {
    var params = {
        TableName: 'CEDSI_ORG',
        FilterExpression: "ORG_NUMBER = :num",
        ExpressionAttributeValues: {
            ":num": "000"
        },
        ProjectionExpression: "ACTIVITIES"
    };
    return new Promise((resolve, reject) => {
        docClient.scan(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                data.Items[0].ACTIVITIES.forEach(item => {
                    if (item.ACTIVITY_ID == activity_id) {
                        resolve(item);
                    }
                })
            }
        });
    });
}
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    
    var id = event.open_id;
    var order_id = event.order_id;
    var params = {
        TableName: 'OFFLINE_ACTIVITY_MESSAGE',
        Key: {
            OPEN_ID: id,
            ORDER_ID: order_id
        }
    };

    docClient.get(params, function (err, data) {
        if (err) {
            console.error(JSON.stringify(err));
            callback(err, null);
        } else {
            var result = data.Item;
            getActivityDetail(data.Item.ACTIVITY_ID).then(data => {
                result.activity = data;
                console.log(result);
                callback(null, result);
            }).catch(err => {
                callback(err, null);
            });
        }
    });
};


