'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient();

function getAccountCode(id) {
    var params = {
        TableName: 'AUTH_USER',
        Key: {
            USER_ID: id
        },
        ProjectionExpression: "ACCOUNT_ID"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Item);
            }
        });
    });
}

function keysort(key, sortType) {
    return function (a, b) {
        return sortType ? (~~a[key] - ~~b[key]) : (~~a[key] - ~~b[key]);
    };
}

function check(arr, class_id) {
    return new Promise((resolve, reject) => {
        var ids = [];
        arr.forEach(item => {
            if (item.CLASS_ID == class_id) {
                ids.push(item.USER_ID);
            }
        });

        var i = 0;
        var result = [];
        arr.forEach(item => {
            if (ids.length == 0) {
                result.push(item);
            } else {
                var m = 0;
                ids.every(it => {
                    m++;
                    if (it == item.USER_ID) {
                        return false;
                    }
                    if (m == ids.length) {
                        result.push(item);
                        return false;
                    }
                    return true;
                });
            }
            i++;
            if (i == arr.length) {
                resolve(result);
            }
        });
    });
}
exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var class_id = event.class_id;
    var id = event.principalId;
    var response = {};

    if (event.role != "3") {
        response.status = "err";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    var result = [];
    getAccountCode(id).then(data => {
        var params = {
            TableName: 'CEDSI_STUDENT',
            IndexName: 'ORG_ID',
            KeyConditionExpression: 'ORG_ID = :id',
            // FilterExpression: "CLASS_ID <> :cid",
            ExpressionAttributeValues: {
                ':id': data.ACCOUNT_ID
                // ':cid': class_id
            }
        };
        docClient.query(params, async function (err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                callback(err, null);
            } else {
                check(data.Items, class_id).then(data0 => {
                    console.log(data0)
                    response.status = "ok";
                    data0 = data0.sort(keysort("STUDENT_ID", false));
                    result.push(data0[0]);
                    var i = 1;
                    if(data0.length == 1) {
                        response.count = result.length;
                        response.data = result;
                        callback(null, response);
                    }
                    for (; i < data0.length;) {
                        if (data0[i].STUDENT_ID == data0[i - 1].STUDENT_ID) {
                            i++;
                            if (i == data0.length) {
                                response.count = result.length;
                                response.data = result;
                                callback(null, response);
                            }
                            continue;
                        }
                        result.push(data0[i]);
                        i++;
                        if (i == data0.length) {
                            response.count = result.length;
                            response.data = result;
                            callback(null, response);
                        }
                    }

                });
            }
        });
    });
};