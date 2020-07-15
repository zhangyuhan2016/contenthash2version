ContentHash2Version
-

[![CircleCI](https://circleci.com/gh/zhangyuhan2016/contenthash2version.svg?style=svg)](https://circleci.com/gh/zhangyuhan2016/contenthash2version)

## 介绍

由于webpack的output.chunk 不能作为函数使用，导致特殊情况下资源版本控制无法完成，所以启动了该项目。

如果存在以下情况，那么使用这个工具去解决它是一个可行的办法

* 需要为每个资源（js,css,images）添加版本号
* 需要追踪这些资源的变更记录
* 需要多个编译环境输出一致 （建议使用yarn.lock）


## 这个工具实现了什么？

基于正则表达式将原有不稳定的contenthash替换现在为可控的版本号。

整个流程看起来像是这样:

1.  现有默认的输出

    ```
    # File
    css/chunk.qwe123.css
    js/chunk.asd123.js
    
    # Quote
    <link href=/css/chunk.qwe123.css>
    <script src="/js/chunk.asd123.js">
    # sourceMappingURL=chunk.asd123.js.map
    ```

2.  修改webpack配置后的输出
    ```
    # File
    css/chunk.qwe123.css
    js/chunk.asd123.js
    
    # Quote
    <link href=/css/chunk.qwe123.css?v=qwe12>
    <script src="/js/chunk.asd123.js?v=asd12">
    # sourceMappingURL=chunk.asd123.js.map?v=asd12
    ```

3.  使用工具替换后的输出
    ```
    # File
    css/chunk.min.css
    js/chunk.min.js
    
    # Quote
    <link href=/css/chunk.min.css?v=8010>
    <script src="/js/chunk.min.js?v=8000">
    # sourceMappingURL=chunk.min.js.map?v=8000
    ```

**这个工具仅仅处理2到3的步骤，如何从1到2?**

修改项目的webpack配置，像这样，css也是如此。
```
config.output
      .chunkFilename('js/[name].[contenthash:10].js?v=[contenthash:8]')
      .filename('js/[name].[contenthash:10].js?v=[contenthash:8]')
```

🎉感谢阅读，恭喜您已经理解并掌握这个简单的工具。

## 安装

```
# global
yarn add contenthash2version -g

# or project
yarn add contenthash2version -D
```

## 使用

```
# global
ch2version -p

# or project

在package.json中加入引用

"scripts": {
    "ch2version": "ch2version",
    ...
}

yarn run ch2version -p
```

### 参数

```
Usage:  ch2version [options] <mode>

execute conversion command in base mode or update mode

Options:
  -i, --inDir <path>            set the path to read dir, defaults to ./dist
  -o, --outDir <path>           set the path to output dir, defaults to ./dist-version
  -c, --config <filePath>       set the path to config.json, defaults to ./ch2version.config.json
  -ov, --outVersion <filePath>  set the path to output version.json, defaults to ./ch2version.version.json
  -v, --version <value>         set the output resource version number, defaults to 8000
  -lang, --language <type>      set the language to display, defaults to en
  -git, --git                   add git information to the version information, defaults to false
  -r, --rewrite                 use the current configuration to rewrite the configuration file, defaults to false
  -clear, --clear               whether to clear the current output directory ? defaults to true
  -p, --prompt                  enable command line prompt, defaults to false
  -h, --help                    display help for command

```

## 问题

如有疑问或需要支持，请使用issues。

## 变更记录

每个版本的详细更改在这里可以看到 [发行说明](/CHANGELOG.md).

## License

[The MIT License](https://raw.githubusercontent.com/stylelint/stylelint/master/LICENSE).

