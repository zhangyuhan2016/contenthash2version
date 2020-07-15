'use strict'
const inquirer = require('inquirer')
const execSync = require('child_process').execSync
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const Language = require('./i18n')
const ProgressBar = require('./progress')
const DefaultConfig = require('./config.json')
const getLineColor = require('./getFileColor')
const Spinnies = require('spinnies')

const LineLog = new Spinnies({ color: 'blue', succeedColor: 'green' })
let ProgressStyle = new ProgressBar({ description: Language.__('tip_progress') })

class CommandInteraction {
  config = DefaultConfig
  parameters = {}
  progressValue = 0

  constructor (config = DefaultConfig) {
    return this.init(config)
  }

  async init (config) {
    await this.getDefaultConfig(config)
    this.selectLanguage(this.config.language)
    ProgressStyle = new ProgressBar({ description: Language.__('tip_progress') })
    await this.createConfig()
    return this.createReleaseData()
  }

  // get defaultConfig
  async getDefaultConfig (option) {
    const conciseOp = {}
    Object.keys(DefaultConfig).forEach(v => {
      const tempV = option[v]
      if (tempV && (typeof tempV === 'string' || typeof tempV === 'boolean')) {
        conciseOp[v] = option[v]
      }
    })
    const defaults = (obj, ...defs) => Object.assign({}, obj, ...defs.reverse(), obj)
    const tempConfig = defaults(conciseOp, DefaultConfig)
    const configPath = path.resolve(tempConfig.config)
    const CanConfig = this.fsExistsSync(configPath)

    try {
      const config = CanConfig ? JSON.parse(await fs.readFileSync(configPath, 'utf8')) : {}
      const nowConfig = defaults(conciseOp, config, tempConfig)
      this.config = nowConfig
    } catch (e) {
      console.log(chalk.red('x ' + Language.__('error_readConfig')))
    }
    if (this.config.git) {
      this.parameters.gitInfo = this.getGitInfo()
    }
    this.parameters.CanBase = this.config.mode === 'base'
    this.parameters.filePath = {
      inDir: path.resolve(this.config.inDir),
      outDir: path.resolve(this.config.outDir)
    }
  }

  // ask whether to create a configuration file
  async createConfig () {
    let CanCreateConfig = {}
    CanCreateConfig.status = this.config.rewrite
    if (this.config.prompt) {
      CanCreateConfig = await inquirer.prompt([{
        type: 'confirm',
        name: 'status',
        default: this.config.rewrite,
        message: Language.__('tip_writeConfig')
      }])
    }
    if (CanCreateConfig.status) {
      try {
        await fs.writeFileSync(path.resolve(this.config.config), JSON.stringify(this.config, null, 4), 'utf8')
      } catch (e) {
        console.log(chalk.red('x ' + Language.__('error_writeConfig')))
        console.log(e)
      }
    }
  }

  // select language
  selectLanguage (a) {
    const Languages = Language.getLocales().includes(a)
    if (Languages) Language.setLocale(a)
  }

  // detect the presence of files or folders
  fsExistsSync (path) {
    try {
      fs.accessSync(path, fs.F_OK)
    } catch (e) {
      return false
    }
    return true
  }

  // delete files or folders
  rmSync (dir) {
    try {
      const stat = fs.statSync(dir)
      if (stat.isFile()) {
        fs.unlinkSync(dir)
      } else {
        const files = fs.readdirSync(dir)
        files
          .map(file => path.join(dir, file))
          .forEach(item => this.rmSync(item))
        fs.rmdirSync(dir)
      }
    } catch (e) {
      console.log(chalk.red('x ' + Language.__('error_delete')))
      console.log(e)
    }
  }

  // create file info
  getFileInfo (file, md5) {
    const tempFileInfo = file.split('.')
    let tempHash = ''
    if (tempFileInfo.length > 2 && tempFileInfo[1].length >= 8) {
      tempHash = tempFileInfo.splice(1, 1)
    }
    const newFileName = tempFileInfo.join('.')
    const tempInfo = {
      name: newFileName,
      hash: tempHash !== '' ? tempHash[0] : '',
      version: this.config.version,
      md5,
      git: this.parameters.gitInfo
    }
    return tempInfo
  }

  // create replace hash map
  getHashArr (obj, HashArr = {}) {
    const tempJ = Object.values(obj)
    if (typeof obj === 'object' && tempJ.length) {
      tempJ.forEach(v => {
        if (typeof v === 'object') {
          if (v.hash) {
            HashArr[v.hash] = v
          } else {
            this.getHashArr(v, HashArr)
          }
        }
      })
      return HashArr
    }
  }

  // get version.json file info
  getOldFileInfo (file, tempPathArr) {
    let oldInfo
    if (!this.parameters.CanBase) {
      // console.log(this.parameters, 'p')
      const { BeforeJSON, pendingReplaceJSON } = this.parameters.replaceConfig
      if (tempPathArr.length > 1) {
        oldInfo = tempPathArr.reduce((s0, s1) => {
          let nextOBJ = s0
          if (typeof s0 === 'string') {
            nextOBJ = BeforeJSON[s0][s1]
          } else {
            nextOBJ = s0[s1]
          }
          return nextOBJ
        })
      } else {
        oldInfo = BeforeJSON[file]
      }
    }
    return oldInfo
  }

  // traverse the file
  async cycleDir (dirPath = this.parameters.filePath.inDir, progress = { base: 1, update: console.log }) {
    const { base = 1, update = console.log } = progress
    const FilesJSON = {}
    const nowFiles = await fs.readdirSync(dirPath)
    for (let i = 0; i < nowFiles.length; i++) {
      const nowProgress = 1 / nowFiles.length * base
      const file = nowFiles[i]
      const fPath = path.join(dirPath, file)
      const isDir = fs.statSync(fPath).isDirectory()
      if (isDir) {
        const NextFilesJSON = await this.cycleDir(fPath, { base: nowProgress, update })
        FilesJSON[file] = NextFilesJSON
      } else {
        this.progressValue += nowProgress
        update(this.progressValue)
        const tempFile = await this.callFile({
          file,
          dirPath,
          fPath
        })
        FilesJSON[tempFile.name] = tempFile
      }
    }
    return FilesJSON
  }

  async callFile ({ file, dirPath, fPath }) {
    // calculation file md5
    const fsHash = crypto.createHash('md5')
    const buffer = fs.readFileSync(fPath, 'utf8')
    fsHash.update(buffer)
    const md5 = fsHash.digest('hex')

    // file information collation
    const tempInfo = this.getFileInfo(file, md5)
    const tempPath = dirPath.replace(this.parameters.filePath.inDir, '').split('/')
    const nowDirName = tempPath.join('/')
    tempPath.push(tempInfo.name)
    if (tempPath.length > 2) {
      tempPath.splice(0, 1)
    }
    const tempPathArr = tempPath.filter(v => v !== '')
    const oldFileInfo = this.getOldFileInfo(file, tempPathArr)

    if (this.parameters.isWrite) {
      const newFilePath = path.resolve(this.config.outDir + nowDirName + '/')
      if (!this.fsExistsSync(newFilePath)) {
        fs.mkdirSync(newFilePath, { recursive: true })
      }
      const allowArr = ['.map', '.js', '.css', '.html']
      const addMinArr = ['.map', '.js', '.css']
      const HashFiles = Object.keys(this.parameters.replaceConfig.pendingReplaceJSON)
      if (allowArr.includes(path.extname(file)) && (/index.html$/.test(file) || HashFiles.includes(tempInfo.hash))) {
        try {
          const files = fs.readFileSync(fPath, 'utf8')
          let result = files
          // 正则替换hash为版本号
          Object.values(this.parameters.replaceConfig.pendingReplaceJSON).forEach(v => {
            const tempHash = v.hash
            if (tempHash && tempHash !== '') {
              if (tempHash.length === 10) {
                // js
                result = result.replace(new RegExp(`${tempHash}`, 'g'), 'min')
                  .replace(new RegExp(`${tempHash.slice(0, 8)}`, 'g'), v.version)
              } else if (tempHash.length === 8) {
                // img or css
                const originalName = v.name.split('.')
                originalName.splice(1, 0, tempHash)
                result = result.replace(new RegExp(`${originalName.join('.')}`, 'g'), `${v.name}?v=${v.version}`)
                  .replace(new RegExp(`${tempHash}`, 'g'), v.version)
              }
            }
          })
          let newFileName = tempInfo.name
          if (addMinArr.includes(path.extname(file)) && tempInfo.hash.length >= 8) {
            newFileName = tempInfo.name.replace(/\./, '.min.')
          }
          fs.writeFileSync(path.resolve(newFilePath + '/' + newFileName), result, 'utf8')
        } catch (e) {
          console.log(chalk.red('x ' + Language.__('error_replace')))
          console.log(e)
        }
      } else {
        fs.copyFileSync(fPath, path.resolve(newFilePath + '/' + tempInfo.name))
      }
    }
    if (tempInfo.md5 === (oldFileInfo ? oldFileInfo.md5 : false)) {
      oldFileInfo.hash = tempInfo.hash
      return oldFileInfo
    } else {
      if (!this.parameters.isWrite) {
        let newFileName = tempInfo.name
        const addMinArr = ['.map', '.js', '.css']
        if (addMinArr.includes(path.extname(file)) && tempInfo.hash.length >= 8) {
          newFileName = tempInfo.name.replace(/\./, '.min.')
        }
        this.parameters.assets.push(nowDirName + '/' + newFileName)
      }
      return tempInfo
    }
  }

  // check if the configuration file is correct
  async checkConfig () {
    if (this.config.version.trim() === '') {
      console.log(chalk.red('x ' + Language.__('error_noVersion')))
      return false
    }
    if (!this.fsExistsSync(path.resolve(this.config.inDir))) {
      console.log(chalk.red('x ' + Language.__('error_noInDir')))
      return false
    }
    const outDitPath = path.resolve(this.config.outDir)
    if (this.config.outDir) {
      const CanOutDir = this.fsExistsSync(outDitPath)
      let outDirStatus = {}
      outDirStatus.clear = this.config.clear
      if (this.config.prompt) {
        outDirStatus = await inquirer.prompt([{
          type: 'confirm',
          name: 'clear',
          default: this.config.clear,
          message: Language.__(CanOutDir ? 'tip_clearOutDir' : 'tip_createOutDir')
        }])
      }
      if (outDirStatus.clear) {
        CanOutDir && this.rmSync(outDitPath)
        fs.mkdirSync(outDitPath, { recursive: true })
      }
      return true
    }
  }

  // get git info
  getGitInfo () {
    const name = execSync('git show -s --format=%cn').toString().trim()
    const email = execSync('git show -s --format=%ce').toString().trim()
    const date = new Date(execSync('git show -s --format=%ci').toString())
    const message = execSync('git show -s --format=%s').toString().trim()
    const commit = execSync('git show -s --format=%h').toString().trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    return {
      name,
      email,
      date,
      message,
      commit,
      branch
    }
  }

  // get version.json & pending replace json
  async getVersionJSON () {
    const config = {}
    const versionJSON = path.resolve(this.config.outVersion)
    if (this.fsExistsSync(versionJSON)) {
      this.parameters.replaceConfig.BeforeJSON = JSON.parse(await fs.readFileSync(versionJSON, 'utf8'))
    }
    LineLog.add('progress', { text: Language.__('wait_progress_version') })
    this.progressValue = 0
    const res = await this.cycleDir(this.parameters.filePath.inDir, {
      update: function (progress) {
        LineLog.update('progress', { text: ProgressStyle.render({ completed: progress * 100, log: null }) })
      }
    })
    LineLog.succeed('progress', { text: Language.__('success_progress_version') })
    try {
      await fs.writeFileSync(versionJSON, JSON.stringify(res, null, 4), 'utf8')
      config.BeforeJSON = res
    } catch (e) {
      console.log(chalk.red('x ' + Language.__('error_writeVersion')))
      console.log(e)
    }

    config.pendingReplaceJSON = this.getHashArr(config.BeforeJSON)
    return config
  }

  // output the final file
  async createReleaseData () {
    const CanConfig = await this.checkConfig()
    if (!CanConfig) {
      return
    }
    const timeStart = new Date().getTime()
    LineLog.add('progress-write', { text: Language.__('wait_progress_write') })
    // read or create version.json
    this.parameters.isWrite = false
    this.parameters.replaceConfig = {
      BeforeJSON: {},
      pendingReplaceJSON: {}
    }
    this.parameters.assets = []
    this.parameters.replaceConfig = await this.getVersionJSON()
    // replace code
    this.parameters.isWrite = true
    this.progressValue = 0
    await this.cycleDir(this.parameters.filePath.inDir, {
      update: function (progress) {
        LineLog.update('progress-write', { text: ProgressStyle.render({ completed: progress * 100, log: null }) })
      }
    })
    LineLog.succeed('progress-write', { text: Language.__('success_progress_write') })
    // out time info
    if (this.parameters.assets.length) {
      console.log(`\n${chalk.cyan.bold(Language.__('tip_update'))}\n\n${this.parameters.assets.map(asset => getLineColor(asset)).join('\n')}`)
    }
    console.log(`\n✨  Done in ${(new Date().getTime() - timeStart) / 1000}s.\n`)
  }
}

module.exports = CommandInteraction
