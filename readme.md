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


# 实现bundler

## 实现思路

要实现一个bundler，其实只需要三个简单的步骤：

1. 解析一个文件并提取它的依赖项

1. 递归地提取依赖并生成依赖关系图

1. 将所有被依赖的模块打包进一个文件

本文使用一个小例子展示如何实现bundler，如下图所示，有三个js文件：入口文件entry.js，entry.js依赖greeting.js，greeting.js依赖name.js：

![example](http://lc-3Cv4Lgro.cn-n1.lcfile.com/d4d514b4a2b0d70e9193/Screen%20Shot%202020-01-25%20at%206.57.20%20PM.png)

三个文件内容分别如下：

**entry.js：**

```
import greeting from './greeting';

console.log(greeting);
```

**greeting.js：**

```
import { name } from './name';

export default `hello ${name}!`;
```

**name.js**

```
export const name = 'MudOnTire';
```

## 创建bundler

我们新建一个`bundler.js`文件，bundler的主要逻辑就写在里面。

### 1. JS Parser

按照我们的实现思路，首先需要能够解析文件的内容并提取它的依赖项。我们可以把整个文件内容以字符串形式读取，并用正则去获取其中的`import`, `export`语句，但是这种方式显然不够优雅高效。更好的方式是使用一个JS parser（解析器）去解析文件内容。所谓的JS parser就是一种能解析JS代码并将其转化成抽象语法树（AST）的高阶模型的工具，抽象语法树是把JS代码拆解成树形结构，且从中能获取到更多代码的执行细节。

在 [AST Explorer](https://astexplorer.net/) 这个网站上面可以查看JS代码解析成成抽象语法树之后的结果。比如，**greeting.js** 的内容用 **acron parser**  解析后的结果如下：

![greeting AST](http://lc-3Cv4Lgro.cn-n1.lcfile.com/d4d514b4a2b0d70e9193/Screen%20Shot%202020-01-25%20at%206.57.20%20PM.png)

可以看到抽象语法树其实是一个JSON对象，每个节点有一个 `type` 属性和 `import`、`export` 语句解析后的结果等等。可见将代码转成抽象语法树之后更方便提取里面的关键信息。

接下来，我们需要在项目里面引入一个JS Parser。我们选择 [babylon](https://www.npmjs.com/package/babylon)（babylon也是babel的内部使用的JS parser，目前以 [@babel/parser](https://github.com/babel/babel/tree/master/packages/babel-parser)的身份存在于babel的主仓库）。

**安装babylon：**

```
npm install --save-dev @babel/parser
```

或者yarn：

```
yarn add @babel/parser --dev
```