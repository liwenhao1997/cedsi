'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var id = event.principalId;
    if(event.role != "3") {
        var response = {};
        response.status = "fail";
        response.err = "非法访问";
        callback(response,null);
        return;
    }
    getAccountCode(id).then(it => {
        var response = [];
        getClass(it.ACCOUNT_ID).then(item => {
            item.forEach(element => {
                if (element.CLASS_ID == it.ACCOUNT_ID) {
                    if(response.length == item.length) {
                        response = response.sort(keysort("CREATE_TIME",false));
                        callback(null, response);
                    }
                }else {
                    getUserNameById(id).then(data => {
                        element.TEACHER_NAME = data.USER_INFO.NICK_NAME;
                        response.push(element);
                        if(response.length == item.length) {
                            response = response.sort(keysort("CREATE_TIME",false));
                            callback(null, response);
                        }
                    });
                }
            });
        });
    });
};
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
                reject("err");
            } else {
                resolve(data.Item); 
            }
        });
    });
}
function keysort(key,sortType){
    return function(a,b){
        return sortType ? (~~a[key]-~~b[key]): (~~a[key]-~~b[key]);
    };
}
function getClass(id) {
    var params = {
        TableName: 'CEDSI_ORG',
        Key: {
            ORG_ID: id
        },
        ProjectionExpression: "ORG_CLASSES"
        //CLASS_ID,CLASS_NAME,CLASS_MEMBER_COUNT,COURSE_ID,COURSE_NAME,TEACHER_ID,CREATE_TIME
    };

    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(JSON.stringify(err));
            } else {
                resolve(data.Item);
            }
        });
    });
}

function getUserNameById(id) {
    var params = {
        TableName: 'AUTH_USER',
        Key: {
            USER_ID: id
        },
        ProjectionExpression: "USER_INFO.NICK_NAME"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(JSON.stringify(err));
            } else {
                resolve(data.Item);
            }
        });
    });
}


