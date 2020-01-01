'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function keysort(key,sortType){
    return function(a,b){
        return sortType ? (~~a[key]-~~b[key]): (~~a[key]-~~b[key]);
    };
}

exports.handler = (event, context, callback) => {
    var response = {};
    if(event.role != "4") {
        response.status = "fail";
        response.err = "非法访问";
        callback(response,null);
        return;
    }
    var params = {
        TableName: 'CEDSI_ORG',
        ProjectionExpression: "ORG_ID,HEADMASTER,INTRODUCTION,ORG_NAME,ORG_TYPE,ORG_LOCATION,BUSINESS_LICENSE,ORG_NUMBER"
    };

    docClient.scan(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            response.status = "error";
            callback(response,null);
        } else {
            response.status = 'ok';
            data.Items = data.Items.sort(keysort("ORG_NUMBER",false));
            response.data = data.Items;
            callback(null,response);
        }
    });
};