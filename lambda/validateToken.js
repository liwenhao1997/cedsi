var nJwt = require('njwt');

var signingKey = 'cedsi-China';

exports.handler = function(event, context, callback) {        
    console.log('Received event:', JSON.stringify(event));
    console.log(JSON.stringify(event.authorizationToken));
    
    // var token = event.headers.Authorization;
    var token = event.authorizationToken;
    // var methods = event.methods;
    //var token = event.idToken; //test
    
    if (token) {
        //&& queryStringParameters.QueryString1 === "queryValue1"
        //&& stageVariables.StageVar1 === "stageValue1"
        nJwt.verify(token,signingKey,'HS512',function(err,verifiedJwt){
        if(err){
          console.error(err); // Token has expired, has been tampered with, etc
          callback("Unauthorized");
        }else{
          var userId = verifiedJwt.body.userId;
          var role = verifiedJwt.body.roleId;
          callback(null, generateAllow(userId,role, event.methodArn));
        }
      });
    }else {
        callback("Unauthorized");
    }
};
     
// Help function to generate an IAM policy
var generatePolicy = function(principalId,role, effect, resource) {
    // Required output:
    var authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    authResponse.context = {};
    authResponse.context.role = role;
    return authResponse;
};
     
var generateAllow = function(principalId,role, resource) {
    return generatePolicy(principalId,role ,'Allow', resource);
};
     
var generateDeny = function(principalId, resource) {
    return generatePolicy(principalId, 'Deny', resource);
};