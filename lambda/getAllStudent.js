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
                console.error(JSON.stringify(err));
                reject("err1");
            } else {
                var result = {};
                var org_id = data.Item.ACCOUNT_ID;
                var params = {
                    TableName: 'CEDSI_ORG',
                    Key: {
                        ORG_ID: org_id
                    },
                    ProjectionExpression: "ORG_NUMBER"
                };
                docClient.get(params, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        result.org_id = org_id;
                        result.number = data.Item.ORG_NUMBER;
                        resolve(result);
                    }
                });
            }
        });
    });
}

function keysort(key,sortType){
    return function(a,b){
        return sortType ? (~~a[key]-~~b[key]): (~~a[key]-~~b[key]);
    };
}

exports.handler = (event, context, callback) => {
    var id = event.principalId;
    var response = {};
    
    if (event.role != "3") {
        response.status = "err";
        response.err = "非法访问";
        callback(response, null);
        return;
    }
    getAccountCode(id).then(data => {
        var params = {
            TableName: 'CEDSI_STUDENT',
            IndexName: 'ORG_ID',
            KeyConditionExpression: 'ORG_ID = :id',
            ExpressionAttributeValues: {
                ':id': data.org_id
            },
            ProjectionExpression: "STUDENT_INFO,USER_ID"
        };
        docClient.query(params, function(err, data) {
            if (err) {
                console.error(JSON.stringify(err));
                callback(err, null);
            } else {
                response.status = "ok";
                response.data = data.Items.sort(keysort("STUDENT_INFO.STUDENT_ID", false));
                response.count = data.Count;
                callback(null, response);
            }
        });
    });
};