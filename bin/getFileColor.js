'use strict'
const chalk = require('chalk')
const isJS = val => /\.js$/.test(val)
const isCSS = val => /\.css$/.test(val)
const isImage = val => /\.png$/.test(val)
function getLineColor (name) {
  return (isJS(name) && chalk.green(name)) ||
    (isCSS(name) && chalk.blue(name)) ||
    (isImage(name) && chalk.yellow(name)) ||
    chalk.gray(name)
}

module.exports = getLineColor
