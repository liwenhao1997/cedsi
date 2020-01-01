'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;
var response = {};
response.data = [];

function keysort(key, sortType) {
    return function (a, b) {
        return sortType ? (~~a[key] - ~~b[key]) : (~~a[key] - ~~b[key]);
    };
}

exports.handler = (event, context, callback) => {
    response = {};
    response.data = [];
    console.log(JSON.stringify(event));
    if (event.role != "4") {
        response.status = "fail";
        response.err = "非法访问!";
        callback(null, response);
        return;
    }
    var id = event.course_id;
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        Key: {
            ID: id
        },
        ProjectionExpression: "CHAPTERS"
    };

    docClient.get(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            response.status = "error";
            callback(response, null);
        } else {
            if (data.Item.CHAPTERS.length == 0) {
                callback(null, null);
                return;
            }
            var result = data.Item.CHAPTERS;
            var n = 0;
            result.forEach(function (item) {
                if (item.CP_RESOURCE == undefined) {
                    if (n == result.length - 1) {
                            response.data = response.data.sort(keysort("CP_NUMBER", false));
                            response.status = "ok";
                            callback(null, response);
                            response = {};
                            response.data = [];
                        }
                        n++;
                } else{
                item.CP_RESOURCE.forEach(ele => {
                    if (ele.RS_TYPE == "mp4") {
                        var data = {};
                        data.CP_NAME = item.CP_NAME;
                        data.CP_NUMBER = item.CP_NUMBER;
                        data.CP_ID = item.CP_ID;
                        data.RESOURCE = ele;
                        response.data.push(data);
                        if (n == result.length - 1) {
                            response.data = response.data.sort(keysort("CP_NUMBER", false));
                            response.status = "ok";
                            callback(null, response);
                            response = {};
                            response.data = [];
                        }
                        n++;
                    } else {
                        if (n == result.length - 1) {
                            response.data = response.data.sort(keysort("CP_NUMBER", false));
                            response.status = "ok";
                            callback(null, response);
                            response = {};
                            response.data = [];
                        }
                        n++;
                    }
                });
                }
            });
        }
    });
};