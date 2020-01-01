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
    // if (event.role != "4") {
    //     var response = {};
    //     response.status = "fail";
    //     response.err = "非法访问";
    //     callback(response,null);
    //     return;
    // }
    var params = {
        TableName: 'CEDSI_CURRICULUMS'
    };

    docClient.scan(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err,null);
        } else {
            data.Items = data.Items.sort(keysort("CREATE_TIME"), false);
            if (event.role == "4") {

                callback(null, data.Items);
                return;
            }
            var result = [];
            var i = 0;
            data.Items.forEach(item => {
                item.COURSE_STATUS == "PUBLISH" ? result.push(item) : console.log(item + "未发布");
                i++;
            });
            if (i == data.Items.length) {
                callback(null, result);
            }
            
        }
    });
};
