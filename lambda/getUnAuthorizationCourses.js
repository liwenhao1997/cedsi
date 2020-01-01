'use strict';
var AWS = require('aws-sdk');
AWS.config.update({
    region: 'cn-northwest-1'
});

var docClient = new AWS.DynamoDB.DocumentClient;

function getCourses(id) {
    var params = {
        TableName: 'CEDSI_ORG',
        Key: {
            ORG_ID: id
        },
        ProjectionExpression: "AUTHORIZATION_COURSES"
    };
    return new Promise((resolve, reject) => {
        docClient.get(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Item.AUTHORIZATION_COURSES);
            }
        });
    });
}

function getAllCourse() {
    var params = {
        TableName: 'CEDSI_CURRICULUMS',
        ProjectionExpression: "ID, COURSE_NAME"
    };

    return new Promise((resolve, reject) => {
        docClient.scan(params, function (err, data) {
            if (err) {
                console.log(JSON.stringify(err));
                reject(err);
            } else {
                resolve(data.Items);
            }
        });
    });
}
exports.handler = (event, context, callback) => {
    var org_id = event.id;
    var response = {};
    response.data = {};
    getAllCourse().then(courses => {
        getCourses(org_id).then(au_courses => {
            response.data.all = courses;
            response.data.authorization = au_courses == undefined ? [] : au_courses;
            response.status = "ok";
            callback(null, response);
        }).catch(err => {
            callback(err, null);
        });
    }).catch(err => {
        callback(err, null);
    });
};