// eslint-disable-next-line
'use strict';

const SUCCESS = {
  statusCode: 200,
}

module.exports.connect = async (event, context) => {
  console.log(event)

  return SUCCESS
}
