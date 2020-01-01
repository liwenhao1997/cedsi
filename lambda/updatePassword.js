'use strict';
let AWS = require('aws-sdk');
let crypto = require('crypto'); //加载crypto库
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

function randomStr(len) {
  // isFinite 判断是否为有限数值
  if (!Number.isFinite(len)) {
    throw new TypeError('Expected a finite number');
  }
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

exports.handler = (event, context, callback) => {
  console.log(JSON.stringify(event));
  let id = event.principalId;
  var password = event.password;
  console.log(password)
  let oldpwd = event.old;

  var params = {
    TableName: "AUTH_USER",
    Key: {
      USER_ID: id
    }
  };
  docClient.get(params, async function (err, data) {
    if (err) {
      console.error(JSON.stringify(err));
    } else {
      console.log(data.Item);
      var newPwd = oldpwd + data.Item.SALT;
      newPwd = crypto.createHash('SHA256').update(newPwd).digest('hex');
      if (newPwd == data.Item.PASSWORD) {
        console.log("验证成功");
        let salt = randomStr(32);
        var newp = password + salt;
        console.log(newp);
        password = await crypto.createHash('SHA256').update(newp).digest('hex');

        let params = {
          TableName: "AUTH_USER",
          Key: {
            USER_ID: id
          },
          UpdateExpression: "set PASSWORD = :p, SALT = :s",
          ExpressionAttributeValues: {
            ":p": password,
            ":s": salt
          }
        };
        docClient.update(params, function (err, data) {
          err ? callback(err, null) : callback(null, data);
        });
      } else {
        callback("密码错误", null);
      }
    }
  });

};