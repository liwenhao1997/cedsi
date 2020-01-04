'use strict';
let AWS = require('aws-sdk');
let crypto = require('crypto'); //加载crypto库
AWS.config.update({ region: 'cn-northwest-1' });
let docClient = new AWS.DynamoDB.DocumentClient;

function getAccountCode(code) {
  let params = {
    TableName: 'CEDSI_ORG',
    FilterExpression: "ORG_CODE = : code",
    ProjectionExpression: "ORG_ID"
  };
  return new Promise((resolve, reject) => {
    docClient.scan(params, function (err, data) {
      err ? reject(err) : resolve(data.Items[0]);
    });
  });
}

function randomStr(len) {
  // isFinite 判断是否为有限数值
  if (!Number.isFinite(len)) {
    throw new TypeError('Expected a finite number');
  }
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

function isUserNameDuplicate(userName) {
  let params = {
    IndexName: "USER_NAME",
    TableName: "AUTH_USER",
    KeyConditionExpression: 'USER_NAME = :name',
    ExpressionAttributeValues: { ':name': userName }
  };
  return new Promise((resolve, reject) => {
    docClient.query(params, function (err, data) {
      err ? reject(err) : resolve(data);
    });
  });
}

function register(username, password, role, ROLE_ID, ACCOUNT_ID) {
  let sha256 = crypto.createHash('sha256'); //定义加密方式:md5不可逆,此处的sha256可以换成任意hash加密的方法名称；
  sha256.update(username);
  let userID = sha256.digest('hex'); //加密后的值
  let salt = randomStr(32);
  password = crypto.createHash('SHA256').update(password + salt).digest('hex');

  let item = {
    "USER_ID": userID,
    "USER_NAME": username,
    "PASSWORD": password,
    "CREATE_TIME": String(Date.now()),
    "ROLE_ID": ROLE_ID,
    "SALT": salt,
    "USER_STATUS": "active",
    "USER_INFO": {
      "AVATAR": "https://cedsi.s3.cn-northwest-1.amazonaws.com.cn/default_avatar.png",
      "EMAIL": "example@qq.com",
      "GENDER": "1",
      "NICK_NAME": randomStr(8),
      "PHONE": "12345678900",
      "UPDATE_TIME": String(Date.now())
    }
  };
  if (role) {
    item.ACCOUNT_ID = ACCOUNT_ID
  }

  let params = {
    TableName: "AUTH_USER",
    Item: item
  };
  return new Promise((resolve, reject) => {
    docClient.put(params, function (err, data) {
      if (err) {
        console.error(params);
        reject(err);
      }
    });
  });
}

exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  let username = event.username;
  let password = event.password;
  let role = event.account;
  let ROLE_ID = role ? "3" : "0";
  let ACCOUNT_ID = "";
  let response = { status: "fail", err: "" };

  // 检查是否为企业注册
  if (role) {
    let code = await getAccountCode(role);
    if (code) {
      ACCOUNT_ID = code.ORG_ID;
    } else {
      response.err = "无效的企业ID";
      callback(response, null);
      return
    }
  }

  // 检查用户名是否重复
  let userNameDuplicate = await isUserNameDuplicate(event.username);
  if (userNameDuplicate.Count) {
    response.err = "用户名重复!";
    return response;
  }
  
  // 数据库插入数据
  await register(username, password, role, ROLE_ID, ACCOUNT_ID);
  response.status = "success";
  response.err = "注册成功";
  response.data = username;
  return response;
};