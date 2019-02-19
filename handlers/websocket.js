// eslint-disable-next-line
'use strict';

const AWS = require('aws-sdk')

const ddb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
})

const SUCCESS = {
  statusCode: 200,
}

module.exports.connect = async (event, context, callback) => {
  console.log(event)
  console.log('\n')

  Object.keys(event).forEach((key) => {
    console.log(`KEY: ${key}`)
    console.log(event[key])
  })

  return SUCCESS
}
