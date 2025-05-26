const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: 'AKIAZVMTU657MZCC3UOE', 
  secretAccessKey: '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', 
  region: 'ap-southeast-2', 
});

const s3 = new AWS.S3();

module.exports = s3;