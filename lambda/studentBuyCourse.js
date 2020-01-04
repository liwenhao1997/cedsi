'use strict';
var AWS = require('aws-sdk');
AWS.config = new AWS.Config({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function getIndex(userId, orderId) {
    var params = {
        TableName: "AUTH_USER",
        Key: {
            USER_ID: userId
        },
        ProjectionExpression: "USER_ORDER"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                var index = 0;
                data.Item.USER_ORDER.forEach(element => {
                    if (element.ORDER_ID == orderId) {
                        resolve(index);
                    }
                    index++;
                });
            }
        });
    })
}

function checkOrder(user_id, order_id) {
    var params = {
        TableName: 'AUTH_USER',
        Key: {
            USER_ID: user_id
        },
        ProjectionExpression: "USER_ORDER"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
            } else {
                data.Item.USER_ORDER.forEach(item => {
                    if (item.ORDER_ID == order_id && item.PAY_STATUS == "SUCCESS") {
                        resolve(true);
                    }
                })
            }
        });
    });
}

function addProduct(order_id, id, cover) {
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
    if (order_id != "") {
        addProduct(order_id, course_id, cover);
    }

    checkOrder(order_id).then(data => {
        if (data) {
            var course = {
                "COURSE_ID": course_id,
                "FINISH_CHAPTER": [],
                "CREATE_TIME": Date.now()
            }
            var params = {
                TableName: 'CEDSI_STUDENT',
                Key: {
                    USER_ID: id
                },
                UpdateExpression: 'SET COURSE_INFO = list_append(if_not_exists(COURSE_INFO, :empty_object), :course)',
                ExpressionAttributeValues: {
                    ":empty_object": [],
                    ":course": course
                }
            };
            docClient.update(params, function (err, data) {
                if (err) {
                    console.error(JSON.stringify(err));
                    callback(err, null);
                } else {
                    callback(null, {
                        status: "ok"
                    });
                }
            });
        }
    }).catch(err => {
        console.error(JSON.stringify(err));
        callback("订单无效", null);
    });

};
