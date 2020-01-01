'use strict';
var AWS = require("aws-sdk");
var nJwt = require('njwt');
var crypto = require('crypto');
AWS.config.update({
    region: "cn-northwest-1",
  });
var docClient = new AWS.DynamoDB.DocumentClient;

function createToken(userId,username,roleId) {
    var exp = Date.now() + (60*60*1000);
    var claims = {
        userId:userId,
        username:username,
        roleId: roleId
      };
      var signingKey = "cedsi-China";
      var jwt = nJwt.create(claims,signingKey,'HS512');
      
      jwt.setExpiration(exp);
      var token = jwt.compact();
      return token;
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var username = event.username;
    var password = event.password;
    var params = {
        TableName : "AUTH_USER",
        IndexName: "USER_NAME",
        KeyConditionExpression: "USER_NAME = :name",
        ExpressionAttributeValues: {
            ":name": username
        },
        ProjectionExpression: "USER_ID,PASSWORD,SALT,ROLE_ID,USER_STATUS"
    };

    docClient.query(params,function(err,data){
        if(err){
            console.log("table info:",params);
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            callback(err,null);
        }else{
            var result = data.Items[0];
            var response = {};
            if(result) {
                if (result.USER_STATUS == "disable") {
                    response.status = "fail";
                    callback(null,response);
                    return;
                }
                var newPwd = password + result.SALT;
                console.log(newPwd);
                newPwd=crypto.createHash('SHA256').update(newPwd).digest('hex');
                console.log(newPwd);
                console.log(result.PASSWORD);
                if (newPwd == result.PASSWORD) {
                    response.status = "ok";
                    response.token = createToken(result.USER_ID, result.USER_NAME, result.ROLE_ID);
                    response.role = result.ROLE_ID;
                    response.userId = result.USER_ID;
                    response.exp = Date.now() + (8*60*60*1000);
                    callback(null,response);
                } else {
                    response.status = "fail";
                    console.error("非法！");
                    callback(null,response);
                }
            } else {
                response.status = "fail";
                callback(null,response);
            }
            
        }
    });
};



