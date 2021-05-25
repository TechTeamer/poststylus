const path = require('path')
const postcss = require('postcss')

const fake = function () {
  const mocks = require(path.join(__dirname, 'mocks'))
  const deps = { postcss: postcss }

  return mocks(deps).plugin
}

module.exports = fake
