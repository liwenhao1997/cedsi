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
    var id = event.principalId;
    var params = {
        TableName: 'STUDENT_ORDER',
        IndexName: 'USER_ID',
        KeyConditionExpression: 'USER_ID = :id',
        ExpressionAttributeValues: {
            ':id': id
        }
        // ProjectionExpression: "CLASS_ID,CLASS_NAME,CLASS_MEMBER_COUNT,COURSE_ID,COURSE_NAME,TEACHER_ID"
    };
        docClient.query(params, function (err, data) {
            if (err) {
                callback(JSON.stringify(err), null);
            } else {
                data.Items = data.Items.sort(keysort("CREATE_TIME"), false);
                callback(null, data.Items);
            }
        });
};