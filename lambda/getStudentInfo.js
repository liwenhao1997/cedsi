'use strict';
var AWS = require("aws-sdk");
AWS.config.update({
    region: "cn-northwest-1",
  });
var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var id = event.principalId;
    // var id = "43d4b60bc84cafdac72db222548f4200509e3a3ef855a1f30789795e56655fc8";
    var params = {
        TableName : "USER_INFO",
        KeyConditionExpression: "USER_ID = :id",
        ExpressionAttributeValues: {
            ":id": id
        },
        ProjectionExpression: "AVATAR,NICK_NAME,CREATED_TIME,GENDER,EMAIL,PHONE"
         
    };

    docClient.query(params,function(err,data){
        if(err){
            console.log("table info:",params);
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            callback(err,null);
        }else{
            console.log(data.Items[0]);
            callback(null, data.Items[0]);
        }
    });
};



