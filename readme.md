# 从无到有实现简易版Webpack

# 什么是bundler

市面上现在有很多bundler，最著名的就是webpack，此外常见的还有 [browserify](http://browserify.org/)，[rollup](http://rollupjs.org)，[parcel](https://parceljs.org/)等。虽然现在的bundler进化出了各种各样的功能，但它们都有一个共同的初衷，就是能让前端开发过程中使用上模块，更好的管理依赖、更好的工程化。

## Modules

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

## Dependency Graph

一般项目需要一个入口文件（entry point），

![dependency graph](http://lc-3Cv4Lgro.cn-n1.lcfile.com/736024484f6a12858eb7/dependency%20graph3.png)