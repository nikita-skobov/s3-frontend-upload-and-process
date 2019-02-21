// eslint-disable-next-line
'use strict';

const AWS = require('aws-sdk')

const Status = require('../models/status')
const Errors = require('../models/errors')

const s3 = new AWS.S3({
  region: process.env.REGION,
  signatureVersion: 'v4',
})

const ddb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
})

function updateStatus(key, desiredStatus) {
  const stat = Status()
  const indexOfPreviousStatus = stat.getIndex(desiredStatus) - 1

  return new Promise(async (res, rej) => {
    try {
      await ddb.update({
        TableName: process.env.TABLE_NAME,
        Key: {
          [process.env.PARTITION_KEY]: key,
        },
        UpdateExpression: 'set statusCode = statusCode + :x', // increment by attrb #a by :x
        ConditionExpression: 'statusCode = :y', // only increment if status = the upload signature status
        ExpressionAttributeValues: {
          ':x': 1, // increment by 1
          // only increment status if it is currently at the previous step
          // this avoids incrementing twice in a case where this function gets triggered multiple times
          ':y': indexOfPreviousStatus,
        },
      }).promise()

      return res()
    } catch (e) {
      if (e.errorType && e.errorType === 'ConditionalCheckFailedException') {
        // if it gets a conditional check error, that means its simply retrying a previous
        // invocation. we should not prevent execution just because it is retrying an event
        return res()
      }

      // otherwise if there was some kind of database/network error, then yes we want to reject
      return rej(e)
    }
  })
}

function processObject(obj) {
  // simulate processing the object by waiting a few seconds
  // in a real application this might be image resizing
  // video rendering/transcoding, as well as other time consuming tasks 
  return new Promise((res) => {
    setTimeout(() => {
      res(obj)
    }, 4000)
  })
}

function enterSomethingIntoDatabase(obj) {
  // simulate entering data into a database
  // most database requests are fairly quick, so the timeout will
  // be shorter for this than processing the object
  return new Promise((res) => {
    setTimeout(res, 1000)
  })
}

module.exports.handler = async (event, context) => {
  const errs = Errors()

  const SUCCESS = {
    statusCode: 200,
  }

  console.log(event.Records[0])
  const { eventTime } = event.Records[0]
  const { sourceIPAddress } = event.Records[0].requestParameters
  const { name } = event.Records[0].s3.bucket
  const { key, size } = event.Records[0].s3.object
  const metaSize = size.toString(10)

  if (size > process.env.MAX_UPLOAD_SIZE || size === 0) {
    // prevent further processing if the object is larger than the limit (or 0)
    // NOTE: here, you may wish to delete the item. Remember that your function
    // role must have permission to delete items if you want to do this.
    // Also, we return 'SUCCESS' here simply because we don't want to process it anymore
    // if we returned an error, lambda would retry this request a few more times.

    // update the table entry for this code to contain an error.
    // when the user polls for their code, they will be notified of the error, and what type it is

    await ddb.update({
      TableName: process.env.TABLE_NAME,
      Key: {
        [process.env.PARTITION_KEY]: key,
      },
      UpdateExpression: 'set errorCode = :x',
      ExpressionAttributeValues: {
        ':x': errs.getIndex('Invalid upload size'),
      },
    })

    return SUCCESS
  }

  // retrieve the object that the user uploaded
  const s3Obj = await s3.getObject({
    Bucket: name,
    Key: key,
  }).promise()  
  console.log(s3Obj)

  // TODO: add code to actually process the data
  const newObject = await processObject(s3Obj)
  await updateStatus(key, 'Successfully processed data')

  await s3.putObject({
    Body: newObject.Body,
    Bucket: process.env.OUTPUT_BUCKET,
    Key: `modifiedobject_${key}`,
  }).promise()

  // here we dont actually enter anything into a database, but in a real application
  // you might make a table entry based on your application logic.
  await enterSomethingIntoDatabase(newObject)
  await updateStatus(key, 'Successfully entered data into database')

  return SUCCESS
}