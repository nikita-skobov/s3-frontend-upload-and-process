// eslint-disable-next-line
'use strict';

// eslint-disable-next-line
const AWS = require('aws-sdk')

const Status = require('../models/status')

const ddb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
})

const has = Object.prototype.hasOwnProperty

module.exports.handler = async (event, context) => {
  let statusCode = 500
  let body = { error: 'Unable to poll' }
  let headers = {
    'Content-Type': 'application/json',
    // USE one of the following for CORS. either a specific domain, or all domains
    'Access-Control-Allow-Origin': '*', // Required for CORS support to work
    // 'Access-Control-Allow-Origin': `https://${process.env.DOMAIN}.com`, // Required for CORS support to work

    // USE the following if you have a private API that needs an authorization header
    // 'Access-Control-Allow-Credentials': true, // Required for authorization headers with HTTPS

    // This function generates a unique signature, so you probably don't need caching...
    // 'Cache-Control': 'max-age=2', // by default dont cache for long
  }

  try {
    // TODO: verify the request either using a JWT, cookie, body, etc

    const stats = Status()

    const { code } = event.queryStringParameters

    if (!code) {
      const noCodeErr = new Error('no code')
      noCodeErr.body = {
        error: 'No code provided',
      }
      noCodeErr.statusCode = 400
      throw noCodeErr
    }

    const data = await ddb.get({
      TableName: process.env.TABLE_NAME,
      Key: {
        [process.env.PARTITION_KEY]: code,
      },
    }).promise()

    if (!has.call(data.Item, 'statusCode')) {
      const invalidCodeErr = new Error('invalid code')
      invalidCodeErr.body = {
        error: `The code: ${code} does not exist`,
      }
      invalidCodeErr.statusCode = 400
      throw invalidCodeErr
    }

    const sc = data.Item.statusCode

    body = { status: stats.getStep(sc) }
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
