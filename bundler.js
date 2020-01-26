const fs = require('fs');

/**
 * 获取文件信息
 * @param {String} filename 文件名称
 */
function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8');

  console.log(content);
}

createAsset('./example/entry.js');
