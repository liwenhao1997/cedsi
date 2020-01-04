
'use strict';
var AWS = require('aws-sdk');
AWS.config.update({ region: 'cn-northwest-1' });
var docClient = new AWS.DynamoDB.DocumentClient;

function scanAvtivityPromise() {
    var params = { TableName: 'CEDSI_ACTIVITY' };
    return new Promise((resolve, reject) => {
        docClient.scan(params, function (err, data) {
            if (err) {
                console.log(err);
                reject("Couldn\'t fetch the CEDSI_ACTIVITY items");
            }
            resolve(data);
        });
    });
}

function getUserInfoPromise(userId) {
    var params = {
        TableName: 'AUTH_USER',
        Key: { USER_ID: userId },
        ProjectionExpression: "USER_INFO.NICK_NAME"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
            
        });
    });
}

function addAttributes(res) {
    return new Promise((resolve, reject) => {
        if (!res.Items.length) { reject("Empty Activity List") }
        else {
            var promises = [];
            res.Items.forEach(item => {
                promises.push(getUserInfoPromise(item.PRINCIPAL_ID));
            });
            Promise.all(promises).then(result => {
                res.Items.forEach((item, index) => {
                    item.principal = result[index].Item.USER_INFONICK_NAME;
                    delete item.PRINCIPAL_ID;
                });
                resolve(res.Items);
            }).catch(err => { reject(err) });
        }
    });
}

exports.handler = (event, context, callback) => {
    var response = {};
    console.log(JSON.stringify(event));
    if (event.role != '1') {
        response.status = 'fail';
        response.err = "非法访问!";
        callback(response, null);
    }
    scanAvtivityPromise()
        .then(res => {
            return addAttributes(res);
        })
        .then(result => {
            callback(null, result);
        })
        .catch(err => {
            console.error(err);
        });
};