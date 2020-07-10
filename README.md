ContentHash2Version
-

## Introduction | [简体中文](/README_CN.md)

Since the output.chunkFilename of webpack cannot be used as a function, the resource version control cannot be completed under special circumstances, so the project was started。

If the following conditions exist, then using this tool to solve it is a feasible way。

* Need to add version number for each resource (js, css, images)
* Need to track changes in these resources

## How to implement this tool？

Based on regular expressions, the original unstable contenthash is now replaced with a controllable version number.

The whole process looks like this:

1.  Existing default output

    ```
    # File
    css/chunk.qwe123.css
    js/chunk.asd123.js
    
    # Quote
    <link href=/css/chunk.qwe123.css>
    <script src="/js/chunk.asd123.js">
    # sourceMappingURL=chunk.asd123.js.map
    ```

2.  The output after modifying the webpack configuration
    ```
    # File
    css/chunk.qwe123.css
    js/chunk.asd123.js
    
    # Quote
    <link href=/css/chunk.qwe123.css?v=qwe12>
    <script src="/js/chunk.asd123.js?v=asd12">
    # sourceMappingURL=chunk.asd123.js.map?v=asd12
    ```

3.  Output after using the tool
    ```
    # File
    css/chunk.min.css
    js/chunk.min.js
    
    # Quote
    <link href=/css/chunk.min.css?v=8010>
    <script src="/js/chunk.min.js?v=8000">
    # sourceMappingURL=chunk.min.js.map?v=8000
    ```

**This tool only handles 2 to 3 steps, how to go from 1 to 2 step?**

Modify the webpack configuration of the project, like this, so is css。
```
config.output
      .chunkFilename('js/[name].[contenthash:10].js?v=[contenthash:8]')
      .filename('js/[name].[contenthash:10].js?v=[contenthash:8]')
```

🎉 Thanks for reading, congratulations on understanding and mastering this simple tool

## Install

``
yarn add contenthash2version -D
``

## Usage

```
contenthash2version -h
```

## Questions

For questions and support please use issues

## Changelog

Detailed changes for each release are documented in the [release notes](/CHANGELOG.md).

## License

[The MIT License](https://raw.githubusercontent.com/stylelint/stylelint/master/LICENSE).

