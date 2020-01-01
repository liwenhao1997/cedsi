'use strict';
var AWS = require("aws-sdk");

AWS.config.update({
    region: "cn-northwest-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();

function getTeacherMsg(id) {
    var params = {
        TableName: "USER_INFO",
        KeyConditionExpression: "USER_ID = :id",
        ExpressionAttributeValues: {
            ":id": id
        },
        ProjectionExpression: "NICK_NAME,AVATAR"
    };
    return new Promise((resolve,reject) => {
        docClient.query(params,function(err,data){
        if(err){
            console.log("table info:",params);
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            reject(err);
        }else{
            console.log(data.Items);
            resolve(data.Items[0]);
        }
    });
    });
}

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var student_id = event.principalId;
    var type = event.type;
    var params = {
    TableName: "CEDSI_STUDENT_MESSAGE",
    IndexName: "RECIPIENT_ID",
    KeyConditionExpression: "RECIPIENT_ID = :id",
    FilterExpression: "MESSAGE_TYPE = :type",
    ExpressionAttributeValues: {
        ":id": student_id,
        ":type": type
    }
};
docClient.query(params, function (err, data) {
    if (err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        var i = 0;
        var r = data.Items;
        data.Items.forEach(function(item) {
            getTeacherMsg(item.DISPATCH_ID).then(data => {
                r[i].avatar = data.AVATAR;
                r[i].teacher_name = data.NICK_NAME;
                delete r[i].dispatcherID;
                delete r[i].recipientID;
                i++;
                if(i == r.length) {
                    callback(null,r);
                }
            });
        });
        
    }

});
};
