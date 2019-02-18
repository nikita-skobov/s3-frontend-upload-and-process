// eslint-disable-next-line
'use strict';

const AWS = require('aws-sdk')

const s3 = new AWS.S3({
  region: process.env.REGION,
  signatureVersion: 'v4',
})

module.exports = async (event, context) => {
  const SUCCESS = {
    statusCode: 200,
  }

  const { eventTime } = event.Records[0]
  const { sourceIPAddress } = event.Records[0].requestParameters
  const { name } = event.Records[0].s3.bucket
  const { key, size } = event.Records[0].s3.object
  const metaSize = size.toString(10)

  const s3Obj = await s3.getObject({
    Bucket: name,
    Key: key,
  }).promise()

  // process the object

  return SUCCESS
}