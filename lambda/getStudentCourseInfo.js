"use strict";

const AWS = require("aws-sdk");
AWS.config.region='cn-northwest-1';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

function queryChapterPromise(courseID) {
    const params = {
        TableName : "CEDSI_CHAPTERS",
        IndexName :"COURSE_ID",
        KeyConditionExpression: "COURSE_ID = :crid",
        
        ExpressionAttributeValues: {
            ":crid": courseID
        }
    };
    return new Promise((resolve, reject) => dynamoDb
        .query(params, (err, data) => {
        if (err) {
            console.error(err);
            reject('Couldn\'t fetch the chapter items.' );
        }else{
            resolve(data.Items);
        }
    }));
}

function scanHomeworkPromise(courseID, studentID) {
    const params = {
        TableName: 'CEDSI_STUDENT_HOMEWORK',
        IndexName: "STUDENT_ID",
        KeyConditionExpression: "STUDENT_ID = :id",
        FilterExpression: "COURSE_ID = :crid",
        ExpressionAttributeValues: {
            ":crid": courseID ,
            ":id": studentID 
        }
    };
    return new Promise((resolve, reject) => dynamoDb
        .query(params, (err, data) => {
        if (err) {
            console.error(err);
            reject('Couldn\'t fetch the homework items.');
            return;
        }
        resolve(data.Items);
    }));
}
function scanCreationsPromise(studentID) {
    const params = {
        TableName: 'CEDSI_STUDENT_PRODUCTION',
        IndexName: "STUDENT_ID",
        KeyConditionExpression: "STUDENT_ID = :id",
        ExpressionAttributeValues: {
            ":id": studentID 
        }
    };
    return new Promise((resolve, reject) => dynamoDb
        .query(params, (err, data) => {
        if (err) {
            console.error(err);
            reject('Couldn\'t fetch the creation items.' );
            return;
        }
        resolve(data.Items);
    }));
}

function scanStudentProcessPromise(studentId,courseId) {
    var params = {
        TableName : "CEDSI_STUDENT_COURSE_INFO",
        KeyConditionExpression: "STUDENT_ID = :sid and COURSE_ID = :cid",
        
        ExpressionAttributeValues: {
            ":sid": studentId,
            ":cid": courseId
        }
    };
    return new Promise((resolve, reject) => dynamoDb
        .query(params, (err, data) => {
        if (err) {
            console.error(err);
            reject('Couldn\'t fetch the creation items.' );
            return;
        }
        resolve({
            length: data.Items[0].FINISH_CHAPTER.length,
            time: data.Items[0].CREATE_TIME
        });
        
    }));
}

//================================== api ==================================
async function getStudentInfo(courseID,studentID) {
    
    const [chapters, homework, creations,learns] = await Promise.all([
        queryChapterPromise(courseID),
        
        scanHomeworkPromise(courseID, studentID),
        scanCreationsPromise(studentID),
        scanStudentProcessPromise(studentID,courseID)
    ]);
    const haveStarted = chapters.length;
    const starNum = homework.reduce((acc, work) => acc + ~~work.HW_RANK, 0);
    return {
        haveStarted: haveStarted,
        haveLearned: learns.length,
        homeworkNum: homework.length,
        chaptersNum: chapters.length,
        homeworkStars: starNum,
        creationNums: creations.length,
        joinTime: learns.time
    };
}

function get(courseId, id) {
    var params = {
        TableName: "CEDSI_CURRICULUMS",
        Key: {
            "ID": courseId
        }
    };
    return new Promise((resolve, reject) => dynamoDb.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            //console.log("课程信息：",data.Item);
            var msg = getStudentInfo(courseId, id);
            msg.then((value) => {
                data.Item.status = value;
                resolve(data.Item);
            });

        }

    }));
}

function getFore(id){
    return new Promise(function(resolve,reject){
        var params = {
        TableName : "CEDSI_STUDENT_COURSE_INFO",
        KeyConditionExpression: "STUDENT_ID = :id",
        
        ExpressionAttributeValues: {
            ":id": id
        },
    };

    dynamoDb.query(params,function(err,data){
        if(err){
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        }else{
            
            var courseIdList=[];
            console.log(data.Items);
            
            for(var i=0;i<data.Items.length;i++){
                courseIdList[i]=data.Items[i].COURSE_ID;
            }
            var courseList=[];
            var i0 = 0;
            courseIdList.forEach(async function(courseId){
                var r = await get(courseId,id);
                r.CREATE_TIME = r.status.joinTime;
                courseList.push(r);
                i0++;
                if(i0 == courseIdList.length){
                    resolve(courseList);
                }
            });
        }
    });
    });
}

function keysort(key,sortType){
    return function(a,b){
        return sortType ? (~~a[key]-~~b[key]): (~~a[key]-~~b[key]);
    };
}
exports.handler = function(event, context, callback) {
    
    // var id = "43d4b60bc84cafdac72db222548f4200509e3a3ef855a1f30789795e56655fc8";
    var id = event.principalId;
    getFore(id).then(function(data){
        data = data.sort(keysort('CREATE_TIME',false));
        callback(null,data);
    });
 
};