'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function countFee(arr) {
    return new Promise((resolve, reject) => {
        var count = 0;
        var index = 0;
        arr.forEach(item => {
            if (item.FEE) {
                count += ~~item.FEE;
            }
            index++;
            if (index == arr.length) {
                resolve(count);
            }
        });
    });
}

function countUncheck(arr) {
    return new Promise((resolve, reject) => {
        var count = 0;
        var index = 0;
        arr.forEach(item => {
            if (item.SIGH_STATUS == 'NOT_SIGH') {
                count ++;
            }
            index++;
            if (index == arr.length) {
                resolve(count);
            }
        });
    });
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    
    var id = event.activity_id;
    var params = {
        TableName: 'OFFLINE_ACTIVITY_MESSAGE',
        IndexName: "ACTIVITY_ID",
        KeyConditionExpression: "ACTIVITY_ID = :id",
        ExpressionAttributeValues: {
            ":id": id
        }
    };

    docClient.query(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err, null);
        } else {
            console.log(data);
            var fee, unchecks;
            countFee(data.Items).then(totalFee => {
                fee = totalFee;
                return countUncheck(data.Items);
            }).then(uncheck => {
                unchecks = uncheck;
                console.log(unchecks);
                callback(null, {
                    fee: fee,
                    unchecks: unchecks,
                    total: data.Count
                });
            });
        }
    });
};


