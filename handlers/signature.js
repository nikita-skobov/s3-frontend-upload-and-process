// eslint-disable-next-line
'use strict';

const uuidv4 = require('uuid/v4')
const AWS = require('aws-sdk')

const Status = require('../models/status')

const s3 = new AWS.S3({
  region: process.env.REGION,
  signatureVersion: 'v4',
})

const ddb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
})

module.exports.handler = async (event, context) => {
  let statusCode = 500
  let body = { error: 'Unable to issue signature' }
  let headers = {
    'Content-Type': 'application/json',
    // USE one of the following for CORS. either a specific domain, or all domains
    'Access-Control-Allow-Origin': '*', // Required for CORS support to work
    // 'Access-Control-Allow-Origin': `https://${process.env.DOMAIN}.com`, // Required for CORS support to work
    
    // USE the following if you have a private API that needs an authorization header
    // 'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    
    // This function generates a unique signature, so you probably don't need caching...
    // 'Cache-Control': 'max-age=2', // by default dont cache for long
  }

  try {
    // TODO: verify the request either using a JWT, cookie, body, etc
    
    const code = uuidv4()
    const currentTimeInSeconds = Math.floor(Date.now() / 1000)
    const expiresIn = 60 * 1 // 1 minute
    const codeExpiration = currentTimeInSeconds + expiresIn

    const url = s3.getSignedUrl('putObject', {
      Bucket: process.env.UPLOAD_BUCKET,
      Expires: process.env.URL_EXPIRE_SECONDS,
      // TODO: change this to something specific to your application
      Key: code,
    })

    const stats = Status()

    await ddb.put({
      TableName: process.env.TABLE_NAME,
      Item: {
        [process.env.PARTITION_KEY]: code,
        codeExpiration,
        status: stats.getIndex('Successfully created upload signature'),
        error: -1,
      },
    }).promise()

    body = { url, code }
    statusCode = 200
  } catch (e) {
    console.log(e)
    headers = e.headers || headers
    statusCode = e.statusCode || statusCode
    body = e.body || body
  }

  return {
    body: JSON.stringify(body),
    statusCode,
    headers,
  }
}