const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const beautify = require('js-beautify').js;


/**
 * 获取JS源文件的抽象语法树
 * @param {String} filename 文件名称
 */
function getAST(filename) {
  const content = fs.readFileSync(filename, 'utf-8');
  const ast = parser.parse(content, {
    sourceType: 'module'
  });
  return ast;
}

/**
 * 获取ImportDeclaration
 */
function getImports(ast) {
  const imports = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      imports.push(node.source.value);
    }
  });
  return imports;
}

let ID = 0;

/**
 * 
 * @param {String} filename 
 */
function getAsset(filename) {
  const ast = getAST(filename);
  const dependencies = getImports(ast);
  const id = ID++;
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
  const beautified = beautify(bundledCode, { indent_size: 2, end_with_newline: false, end_with_newline: false });
  fs.writeFileSync('./main.js', beautified);
}

const graph = createGraph('./example/entry.js');
bundle(graph);




