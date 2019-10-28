
const { Sketch2json, readAndParseFileInSketch } = require('./lib/index.js')
const sketch2json = require('sketch2json')
const fs = require('fs')
const fse = require('fs-extra')
// Document Meta User Page Image Preview

// 解压 sketch file https://github.com/EvanOxfeld/node-unzip
// Sketch2json('./sketch-examples/test.sketch', {
//   single: false,
//   output: `${__dirname}/dist/`
// }).then(() => {
//   console.error('Sketch2json 解压 sketch file 完成！！')
// })


readAndParseFileInSketch('./output/')
