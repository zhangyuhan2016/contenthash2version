const fs = require('fs')
const path = require('path')

const defaultConfig = require('./config.json')

const config = {
  readPath: 'dist',
  baseURL: '/page/',
  templateName: 'index.html',
  urlLocal: '/local/assets',
  output: [
    {
      origin: '//app.example.com',
      fileName: 'index_app.html'
    },
    {
      origin: '//wx.example.cn',
      fileName: 'index_wx.html'
    }
  ]
}

// 将index.html中的静态资源替换为conf中的路径
const replacerHtmlAssets = config => {
  fs.readFile(path.resolve(`${config.readPath}/${config.templateName}`), 'utf8', function(err, files) {
    if (!files) return console.log('找不到文件')
    config.output.forEach(function (item, index) {
      let replaced = files.replace(new RegExp(`${config.baseURL}`, 'g'), `${item.origin}${config.baseURL}`)
      // 在文件中部分 标签 前加换行，避免被正则贪婪匹配全部匹配到
      replaced = replaced.replace(/(<[a-z])/g, `\n$1`)
      replaced = replaced.replace(/script(.*?)src=\/(.*)\/(.*).min.js/g, `script$1src=${item.origin}${config.urlLocal}/$3.min.js`)
      // 将前面添加的换行去掉
      replaced = replaced.replace(/\n/g, '')
      
      fs.writeFileSync(path.resolve(`${config.readPath}/${item.fileName}`), replaced, 'utf8')
      console.log('%s 替换完成', item.fileName)
    })
  })
}

const doReplace = function () {
  fs.readFile(path.resolve(defaultConfig.config), 'utf8', function (err, file) {
    const getConfigFn = c => Object.assign({}, config, c)
    const defaultC = defaultConfig.replaceDomain
    let useConfigs = {}
    if (file) {
      // 有自定义配置文件，使用自定义配置文件
      const fr = JSON.parse(file).replaceDomain
      if (fr) {
        useConfigs = getConfigFn(fr)
      } else {
        useConfigs = getConfigFn(defaultC)
      }
    } else {
      // 无自定义配置文件，使用默认配置
      useConfigs = getConfigFn(defaultC)
    }

    // 替换
    replacerHtmlAssets(useConfigs)
  })
}

module.exports = doReplace
