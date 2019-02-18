// eslint-disable-next-line
'use strict';

const AWS = require('aws-sdk')

const s3 = new AWS.S3({
  region: process.env.REGION,
  signatureVersion: 'v4',
})

module.exports.handler = async (event, context) => {
  const SUCCESS = {
    statusCode: 200,
  }

  console.log(event.Records[0])
  const { eventTime } = event.Records[0]
  const { sourceIPAddress } = event.Records[0].requestParameters
  const { name } = event.Records[0].s3.bucket
  const { key, size } = event.Records[0].s3.object
  const metaSize = size.toString(10)

  if (size > process.env.MAX_UPLOAD_SIZE) {
    // prevent further processing if the object is larger than the limit
    // NOTE: here, you may wish to delete the item. Remember that your function
    // role must have permission to delete items if you want to do this.
    // Also, we return 'SUCCESS' here simply because we don't want to process it anymore
    // if we returned an error, lambda would retry this request a few more times.
    return SUCCESS
  }

  const s3Obj = await s3.getObject({
    Bucket: name,
    Key: key,
  }).promise()

  console.log(s3Obj)

  // add code to process the object

  await s3.putObject({
    Body: s3Obj.Body,
    Bucket: process.env.OUTPUT_BUCKET,
    Key: `modifiedobject_${key}`,
  }).promise()

  return SUCCESS
}