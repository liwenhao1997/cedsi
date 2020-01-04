'use strict';
var AWS = require("aws-sdk");
AWS.config.update({
    region: "cn-northwest-1",
  });
var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var id = event.principalId;
    var params = {
        TableName : "AUTH_USER",
        Key: {
            USER_ID: id
        },
        ProjectionExpression: "USER_INFO"
         
    };

    docClient.query(params,function(err,data){
        if(err){
            console.log("table info:",params);
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            callback(err,null);
        }else{
            callback(null, data.Item.USER_INFO);
        }
    });
};



