'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function keysort(key,sortType){
    return function(a,b){
        return sortType ?~~(a[key]<b[key]):~~(a[key]>b[key]);
    };
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var response = {};
    if(event.role != "5") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response,null);
        return;
    }
    var params = {
        TableName: 'AUTH_USER',
        IndexName: 'ROLE_ID',
        KeyConditionExpression: 'ROLE_ID = :id',
        ProjectionExpression: "USER_NAME,USER_STATUS,CREATE_TIME,USER_ID",
        ExpressionAttributeValues: {
            ':id': "4"
        }
    };

    docClient.query(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err.errMessage));
            response.status = 'fail';
            callback(response,null);
        } else {
            response.status = "ok";
            var s = data.Items;
            s.sort(keysort('CREATE_TIME',true));
            response.data = s;
            callback(null,response);
        }
    });
};