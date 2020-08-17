#!/usr/bin/env node

const package = require('../package.json')
const { program } = require('commander')
const chalk = require('chalk')
const CommandInteraction = require('./convert')
const doReplace = require('./replacer')

// logo
const logo = `
      _     ____                     _
  ___| |__ |___ \\__   _____ _ __ ___(_) ___  _ __
 / __| '_ \\  __) \\ \\ / / _ \\ '__/ __| |/ _ \\| '_ \\
| (__| | | |/ __/ \\ V /  __/ |  \\__ \\ | (_) | | | |
 \\___|_| |_|_____| \\_/ \\___|_|  |___/_|\\___/|_| |_|

`

program
  .version(package.version)
  .command('ch2version <mode>')
  .description(chalk`execute conversion command in {green.bold base} mode or {green.bold update} mode`)
  .option('-i, --inDir <path>', 'set the path to read dir, defaults to ' + chalk.yellow.bold('./dist'))
  .option('-o, --outDir <path>', 'set the path to output dir, defaults to ' + chalk.yellow.bold('./dist-version'))
  .option('-c, --config <filePath>', 'set the path to config.json, defaults to ' + chalk.yellow.bold('./ch2version.config.json'))
  .option('-ov, --outVersion <filePath>', 'set the path to output version.json, defaults to ' + chalk.yellow.bold('./ch2version.version.json'))
  .option('-v, --version <value>', 'set the output resource version number, defaults to ' + chalk.yellow.bold('8000'))
  .option('-lang, --language <type>', 'set the language to display, defaults to ' + chalk.yellow.bold('en'))
  .option('-git, --git', 'add git information to the version information, defaults to ' + chalk.yellow.bold('false'))
  .option('-r, --rewrite', 'use the current configuration to rewrite the configuration file, defaults to ' + chalk.yellow.bold('false'))
  .option('-clear, --clear', 'whether to clear the current output directory ? defaults to ' + chalk.yellow.bold('true'))
  .option('-p, --prompt', 'enable command line prompt, defaults to ' + chalk.yellow.bold('false'))
  .action(function (mode, options) {
    console.log(chalk.cyan(logo))
    const AllowCommands = ['base', 'update', 'replace']
    if (!AllowCommands.includes(mode)) {
      console.log(chalk.red('x unsupported commands'))
      console.log(chalk`! execute conversion command in {green.bold base} mode or {green.bold update} mode`)
      return false
    }
    options.mode = mode

    switch (mode) {
      case AllowCommands[2]: {
        doReplace()
        break
      }
      default: {
        return new CommandInteraction(options)
      }
    }
  })
  .parse(process.argv)
