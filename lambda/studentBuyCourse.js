'use strict';
var AWS = require('aws-sdk');
AWS.config = new AWS.Config({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function checkOrder(order_id) {
    var params = {
        TableName: 'STUDENT_ORDER',
        Key: {
            ORDER_ID: order_id
        },
        ProjectionExpression: "PAY_STATUS"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
            } else {
                if (data.Item && data.Item.PAY_STATUS == "SUCCESS") {
                    resolve(true);
                } else {
                    reject(false);
                }
            }
        });
    });
}

function addProduct(order_id, id,cover) {
    var params = {
        TableName: 'STUDENT_ORDER',
        Key: {
            ORDER_ID: order_id
        },
        UpdateExpression: "set PRODUCT_ID = :id, COVER = :cover",
        ExpressionAttributeValues: {
            ":id": id,
            ":cover": cover
        }
    };
    return new Promise((resolve, reject) => {
        docClient.update(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
            // } else {
            //     if (data.Item && data.Item.PAY_STATUS == "SUCCESS") {
            //         resolve(true);
            //     } else {
            //         reject(false);
            //     }
            }
        });
    });
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var order_id = event.order_id;
    var id = event.principalId;
    var course_id = event.course_id;
    var cover = event.cover;
    if (order_id == "") {
        var params = {
            TableName: 'CEDSI_STUDENT_COURSE_INFO',
            Item: {
                "STUDENT_ID": id,
                "COURSE_ID": course_id,
                "FINISH_CHAPTER": [],
                "CREATE_TIME": Date.now()
            }
        };
        docClient.put(params, function(err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                callback(err, null);
            } else {
                callback(null, {
                    status: "ok"
                });
            }
        });
    } else {
    addProduct(order_id, course_id,cover);
    checkOrder(order_id).then(data => {
        var params = {
            TableName: 'CEDSI_STUDENT_COURSE_INFO',
            Item: {
                "STUDENT_ID": id,
                "COURSE_ID": course_id,
                "FINISH_CHAPTER": [],
                "CREATE_TIME": Date.now()
            }
        };
        docClient.put(params, function(err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                callback(err, null);
            } else {
                callback(null, {
                    status: "ok"
                });
            }
        });
    }).catch(err => {
        console.error(JSON.stringify(err));
        callback("订单无效", null);
    });
    }
};
