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


# Bundler实现思路

要实现一个bundler，其实只需要三个简单的步骤：

1. 解析一个文件并提取它的依赖项

1. 递归地提取依赖并生成依赖关系图

1. 将所有被依赖的模块打包进一个文件

本文使用一个小例子展示如何实现bundler，如下图所示，有三个js文件：入口文件entry.js，entry.js依赖greeting.js，greeting.js依赖name.js：

![example](http://lc-3Cv4Lgro.cn-n1.lcfile.com/d4d514b4a2b0d70e9193/Screen%20Shot%202020-01-25%20at%206.57.20%20PM.png)

三个文件内容分别如下：

**entry.js：**

```
import greeting from './greeting.js';

console.log(greeting);
```

**greeting.js：**

```
import { name } from './name.js';

export default `hello ${name}!`;
```

**name.js**

```
export const name = 'MudOnTire';
```

# 实现bundler

我们新建一个`bundler.js`文件，bundler的主要逻辑就写在里面。

## 1. 引入JS Parser

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

在 `bundler.js` 中引入babylon：

**bundler.js：**

```
const parser = require('@babel/parser');
```

## 2. 生成抽象语法树

有了JS parser之后，生成抽象语法树就很简单了，我们只需要获取到JS源文件的内容，传入parser解析就行了。

**bundler.js：**

```
const parser = require('@babel/parser');
const fs = require('fs');

/**
 * 获取JS源文件的抽象语法树
 * @param {String} filename 文件名称
 */
function getAST(filename) {
  const content = fs.readFileSync(filename, 'utf-8');
  const ast = parser.parse(content, {
    sourceType: 'module'
  });
  console.log(ast);
  return ast;
}

getAST('./example/greeting.js');
```

执行 `node bundler.js` 结果如下：

![get ast](http://lc-3Cv4Lgro.cn-n1.lcfile.com/184e03c9d4e21c95dac0/get%20ast.png)

## 3. 依赖解析

获取到JS源文件的抽象语法树后，我们便可以去查找代码中的依赖项，我们可以自己写查询方法递归的去查找，也可以使用 [@babel/traverse](https://babeljs.io/docs/en/babel-traverse) 进行查询，@babel/traverse 模块维护整个树的状态，并负责替换，删除和添加节点。

**安装 @babel/traverse：**

```
npm install --save-dev @babel/traverse
```

或者yarn：

```
yarn add @babel/traverse --dev
```

使用 `@babel/traverse` 就可以很方便的获取 `import` 节点了。

**bundler.js：**

```
const traverse = require('@babel/traverse').default;

/**
 * 获取ImportDeclaration
 */
function getImports(ast) {
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      console.log(node);
    }
  });
}

const ast = getAST('./example/entry.js');
getImports(ast);
```

执行 `node bundler.js` 执行结果如下：

![get imports](http://lc-3Cv4Lgro.cn-n1.lcfile.com/0b2763c08eaa7eb1155e/get%20imports.png)

由此我们可以获得 `entry.js` 中 `import` 了那些模块和这些模块的路径。稍稍修改一下 `getImports` 方法获取所有的依赖：

**bundler.js：**

```
function getImports(ast) {
  const imports = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      imports.push(node.source.value);
    }
  });
  console.log(imports);
  return imports;
}
```

**执行结果：**

![dependencies](http://lc-3Cv4Lgro.cn-n1.lcfile.com/3b1895c84840c2bc8dc3/dependencies.png)

最后，我们将方法封装一下，为每个源文件生成唯一的依赖信息：

```
let ID = 0;

function getAsset(filename) {
  const ast = getAST(filename);
  const dependencies = getImports(ast);
  const id = ID++;
  return {
    id,
    filename,
    dependencies
  }
}

const mainAsset = getAsset('./example/entry.js');
console.log(mainAsset);
```

**执行结果：**

![assets](http://lc-3Cv4Lgro.cn-n1.lcfile.com/55ed335317e31db90241/assets.png)

## 4. 生成Dependency Graph

接下来，我们需要写一个方法生成依赖关系图，该方法应该接受入口文件路径作为参数，并返回一个包含所有依赖关系的数组。生成依赖关系图可以通过递归的方式，也可以通过队列的方式。本文使用队列，原理是不断遍历队列中的asset对象，如果asset对象的dependencies不为空，则继续为每个dependency生成asset并加入队列，并为每个asset增加mapping属性，记录依赖之间的关系。持续这一过程直到queue中的元素被完全遍历。具体实现如下：

**bundler.js**

```
/**
 * 生成依赖关系图
 * @param {String} entry 入口文件路径
 */
function createGraph(entry) {
  const mainAsset = getAsset(entry);
  const queue = [mainAsset];

  for (const asset of queue) {
    const dirname = path.dirname(asset.filename);
    asset.mapping = {};
    asset.dependencies.forEach((relPath, index) => {
      const absPath = path.join(dirname, relPath);
      const child = getAsset(absPath);
      asset.mapping[relPath] = child.id;
      queue.push(child);
    });
  }

  return queue;
}
```

生成的依赖关系图对象如下：

![dependency graph](http://lc-3Cv4Lgro.cn-n1.lcfile.com/737e8dc5bfc60a90ab9e/dependency%20graph.png)




