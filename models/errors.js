function Errors() {
  const errors = [
    'Invalid upload size',
  ]

  const retObj = {
    getError: (index) => {
      if (index > 0 && index < errors.length) {
        return errors[index]
      }
      return null
    },
    getIndex: (err) => {
      return errors.indexOf(err)
    },
  }

  return retObj
}

module.exports = Errors
