'use strict'
function ProgressBar ({
  description = 'Progress: ',
  barWidth = 25,
  fillChar = '█',
  bgChar = '░'
} = {}) {
  this.render = function ({ completed, total = 100, log = console.log }) {
    const percent = (completed / total).toFixed(4)
    const gridWidth = Math.floor((percent > 1 ? 1 : percent) * barWidth)
    const fill = new Array(gridWidth).fill(fillChar).join('')
    const bg = new Array(barWidth - gridWidth).fill(bgChar).join('')
    const cmdText = description + fill + bg + ' ' + (100 * percent).toFixed(2) + '% \t \r'
    typeof log === 'function' && log(cmdText)
    return cmdText
  }
}

module.exports = ProgressBar
