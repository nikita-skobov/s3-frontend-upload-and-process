function Status() {
  const steps = [
    'No progress yet',
    'Successfully created upload signature',
    'Successfully processed data',
    'Successfully entered data into database',
  ]

  const retObj = {
    getStep: (index) => {
      if (index > 0 && index < steps.length) {
        return steps[index]
      }
      return null
    },

    getIndex: step => steps.indexOf(step),
  }

  return retObj
}

module.exports = Status
