# 从无到有实现简易版Webpack

# 什么是bundler

市面上现在有很多bundler，最著名的就是webpack，此外常见的还有 [browserify](http://browserify.org/)，[rollup](http://rollupjs.org)，[parcel](https://parceljs.org/)等。虽然现在的bundler进化出了各种各样的功能，但它们都有一个共同的初衷，就是能让前端开发过程中使用上模块，更好的管理依赖、更好的工程化。

## Modules（模块）

目前最常见的模块系统有两种：
[ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)：

```
// 引入模块
import _ from 'lodash';

// 导出模块
export default someObject;
```

[CommonJS Modules](https://en.wikipedia.org/wiki/CommonJS)：

```
// 引入模块
const _ = require('lodash');

// 导出模块
module.exports = someObject;
```

## Dependency Graph（依赖关系图）

一般项目需要一个入口文件（entry point），bundler从该入口文件进入，查找项目依赖的所有模块，形成一张依赖关系图，有了关系图bundler才能将所有模块打包成一个文件。

**依赖关系图：**

![dependency graph](http://lc-3Cv4Lgro.cn-n1.lcfile.com/736024484f6a12858eb7/dependency%20graph3.png)

# 实现思路

要实现一个bundler，其实只需要三个简单的步骤：

1. 解析一个文件并提取它的依赖项

1. 递归地提取依赖并生成依赖关系图

1. 将所有被依赖的模块打包进一个文件

