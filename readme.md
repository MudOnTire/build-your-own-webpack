# 从零实现简易版Webpack

# 什么是bundler

市面上现在有很多bundler，最著名的就是webpack，此外常见的还有 [browserify](http://browserify.org/)，[rollup](http://rollupjs.org)，[parcel](https://parceljs.org/)等。虽然现在的bundler进化出了各种各样的功能，但它们都有一个共同的初衷，就是能给前端引入模块化的开发方式，更好的管理依赖、更好的工程化。

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

一般项目需要一个入口文件（entry point），bundler从该入口文件进入，查找项目依赖的所有模块，形成一张依赖关系图，有了依赖关系图bundler进一步将所有模块打包成一个文件。

**依赖关系图：**

![dependency graph](http://lc-3Cv4Lgro.cn-n1.lcfile.com/736024484f6a12858eb7/dependency%20graph3.png)


# Bundler实现思路

要实现一个bundler，有三个主要步骤：

1. 解析一个文件并提取它的依赖项

1. 递归地提取依赖并生成依赖关系图

1. 将所有被依赖的模块打包进一个文件

本文使用一个小例子展示如何实现bundler，如下图所示，有三个js文件：入口文件 **entry.js**，**entry.js** 的依赖文件 **greeting.js**，**greeting.js** 的依赖文件 **name.js**：

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

**name.js：**

```
export const name = 'MudOnTire';
```

# 实现bundler

首先我们新建一个`bundler.js`文件，bundler的主要逻辑就写在里面。

## 1. 引入JS Parser

按照我们的实现思路，首先需要能够解析JS文件的内容并提取其依赖项。我们可以把文件内容读取为字符串，并用正则去获取其中的`import`, `export`语句，但是这种方式显然不够优雅高效。更好的方式是使用JS parser（解析器）去解析文件内容。JS parser能解析JS代码并将其转化成抽象语法树（AST）的高阶模型，抽象语法树是把JS代码拆解成树形结构，且从中能获取到更多代码的执行细节。

在 [AST Explorer](https://astexplorer.net/) 这个网站上面可以查看JS代码解析成成抽象语法树之后的结果。比如，**greeting.js** 的内容用 **acron parser**  解析后的结果如下：

![greeting AST](http://lc-3Cv4Lgro.cn-n1.lcfile.com/12f64645e713a890931a/greeting%20ast2.png)

可以看到抽象语法树其实是一个JSON对象，每个节点有一个 `type` 属性和 `import`、`export` 语句解析后的结果等等。将代码转成抽象语法树之后更方便提取里面的关键信息。

接下来，我们需要在项目里面引入一个JS Parser。我们选择 [babylon](https://www.npmjs.com/package/babylon)（babylon也是babel的内部使用的JS parser，目前以 [@babel/parser](https://github.com/babel/babel/tree/master/packages/babel-parser) 的身份存在于babel的主仓库）。

**安装babylon：**

```
npm install --save-dev @babel/parser
```

**或者yarn：**

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

生成抽象语法树后，便可以去查找代码中的依赖，我们可以自己写查询方法递归的去查找，也可以使用 [@babel/traverse](https://babeljs.io/docs/en/babel-traverse) 进行查询，@babel/traverse 模块维护整个树的状态，并负责替换，删除和添加节点。

**安装 @babel/traverse：**

```
npm install --save-dev @babel/traverse
```

**或者yarn：**

```
yarn add @babel/traverse --dev
```

使用 `@babel/traverse` 可以很方便的获取 `import` 节点。

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

由此我们可以获得 `entry.js` 中依赖的模块和这些模块的路径。稍稍修改一下 `getImports` 方法获取所有的依赖：

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

最后，我们将方法封装一下，为每个源文件生成唯一的依赖信息，包含依赖模块的id、模块的相对路径和模块的依赖项：

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

然后，我们需要写一个方法生成依赖关系图，该方法应该接受入口文件路径作为参数，并返回一个包含所有依赖关系的数组。生成依赖关系图可以通过递归的方式，也可以通过队列的方式。本文使用队列，原理是不断遍历队列中的asset对象，如果asset对象的dependencies不为空，则继续为每个dependency生成asset并加入队列，并为每个asset增加mapping属性，记录依赖之间的关系。持续这一过程直到queue中的元素被完全遍历。具体实现如下：

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

生成的依赖关系如下：

![dependency graph](http://lc-3Cv4Lgro.cn-n1.lcfile.com/737e8dc5bfc60a90ab9e/dependency%20graph.png)


## 5. 打包

最后，我们需要根据依赖关系图将所有文件打包成一个文件。这一步有几个关键点：

1. 打包后的文件需要能够在浏览器运行，所以代码中的ES6语法需要先被babel编译

1. 浏览器的运行环境中，编译后的代码依然需要实现模块间的引用

1. 合并成一个文件后，不同模块的作用域依然需要保持独立

### (1). 编译源码

**首先安装babel并引入：**

```
npm install --save-dev @babel/core
```

**或者yarn：**

```
yarn add @babel/core --dev
```

**bundler.js：**

```
const babel = require('@babel/core');
```

然后对 `getAsset` 方法稍作修改，这里我们使用 `babel.transformFromAstSync()` 方法对生成的抽象语法树进行编译，编译成浏览器可以执行的JS： 

```
function getAsset(filename) {
  const ast = getAST(filename);
  const dependencies = getImports(ast);
  const id = ID++;
  // 编译
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ['@babel/env']
  });
  return {
    id,
    filename,
    dependencies,
    code
  }
}
```

源码编译后生成的依赖关系图内容如下：

![compiled](http://lc-3Cv4Lgro.cn-n1.lcfile.com/90cb59c1044b4c3f9bbd/compiled.png)

可以看到编译后的代码中还有 `require('./greeting.js')` 语法，而浏览器中是不支持 `require()`方法的。所以我们还需要实现 `require()` 方法从而实现模块间的引用。

**(2). 模块引用**

首先打包之后的代码需要自己独立的作用域，以免污染其他JS文件，在此使用IIFE包裹。我们可以先勾勒出打包方法的结构，在**bundler.js**中新增 `bundle()` 方法：

**bundler.js：**

```
/**
 * 打包
 * @param {Array} graph 依赖关系图
 */
function bundle(graph) {
  let modules = '';

  // 将依赖关系图中模块编译后的代码、模块路径和id的映射关系传入IIFE
  graph.forEach(mod => {
    modules += `${mod.id}:[
      function (require, module, exports) { ${mod.code}},
      ${JSON.stringify(mod.mapping)}
    ],`
  })

  // 
  return `
    (function(){})({${modules}})
  `;
}
```

我们先看一下执行 `bundle()` 方法之后的结果（为方便阅读使用 [js-beautify](https://www.npmjs.com/package/js-beautify) 和 [cli-highlight](https://www.npmjs.com/package/cli-highlight) 进行了美化 ）：

![bundled](http://lc-3Cv4Lgro.cn-n1.lcfile.com/9234f4de1df1d65efafb/bundled.png)

现在，我们需要实现模块之间的引用，我们需要实现 `require()` 方法。实现思路是：当调用 `require('./greeting.js')` 时，去mapping里面查找 `./greeting.js` 对应的模块id，通过id找到对应的模块，调用模块代码将 `exports` 返回，最后打包生成 `main.js` 文件。`bundle()` 方法的完整实现如下：

**bundler.js：**

```
/**
 * 打包
 * @param {Array} graph 依赖关系图
 */
function bundle(graph) {
  let modules = '';

  // 将依赖关系图中模块编译后的代码、模块路径和id的映射关系传入IIFE
  graph.forEach(mod => {
    modules += `${mod.id}:[
      function (require, module, exports) { ${mod.code}},
      ${JSON.stringify(mod.mapping)}
    ],`
  })

  const bundledCode = `
    (function (modules) {

      function require(id) {
        const [fn, mapping] = modules[id];

        function localRequire(relPath) {
          return require(mapping[relPath]);
        }

        const localModule = { exports : {} };
        
        fn(localRequire, localModule, localModule.exports);

        return localModule.exports;
      }

      require(0);

    })({${modules}})
  `;
  fs.writeFileSync('./main.js', bundledCode);
}
```

最后，我们在浏览器中运行一下 `main.js` 的内容看一下最后的结果：

![result](http://lc-3Cv4Lgro.cn-n1.lcfile.com/8599de028cf0313f68f6/result.png)

一个简易版本的Webpack大功告成！

本文源码：https://github.com/MudOnTire/build-your-own-webpack