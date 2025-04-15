require("dotenv").config();
const AWS = require('aws-sdk');


AWS.config.update({
    region: process.env.REGION, // Region  của DynamoDB, nên sài một region 1 bộ service liên quan
    accessKeyId: process.env.ACCESS_KEY_ID, // Access key ID của IAM user có quyền truy cập vào DynamoDB
    secretAccessKey: process.env.SECRET_ACCESS_KEY, // Secret access key của IAM user có quyền truy cập vào DynamoDB
  });

const s3 = new AWS.S3();

module.exports = s3;