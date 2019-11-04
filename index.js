
const { Sketch2json, readAndParseFileInSketch, sketchJsonToSketchFile, multiplArtboardJsonToSketchFile } = require('./lib/index.js')
const fs = require('fs')
const fse = require('fs-extra')
// Document Meta User Page Image Preview

// 解压 sketch file https://github.com/EvanOxfeld/node-unzip
// Sketch2json('./sketch-examples/test.sketch', {
//   single: true,
//   output: `${__dirname}/dist/`
// }).then(() => {
//   console.error('Sketch2json 解压 sketch file 完成！！')
// })


// readAndParseFileInSketch 读取 sketch 解压文件路径生成 sketch 文件
// readAndParseFileInSketch('./output/')


// sketchJsonToSketchFile 根据sketch json 数据生成 sketch 文件
// const singleSketchJson = fse.readJsonSync('./test-json/single-sketch.json')
// const preview = fse.readFile('./test-json/preview.png')
// const images = [{
//   '38ca6125035f10996026c761d9779f85c8d1f99e.png': fse.readFile('./test-json/38ca6125035f10996026c761d9779f85c8d1f99e.png')
// }]
// const output = './single.sketch'
// sketchJsonToSketchFile({ sketchJson: singleSketchJson, preview, images }, output)

// 3c959080-f72b-11e9-8aed-f77013a4e0b0.json
const artboard = fse.readJsonSync('./test-json/3c959080-f72b-11e9-8aed-f77013a4e0b0.json')
const artboard1 = fse.readJsonSync('./test-json/06acbf70-f564-11e9-a6c2-fd57ed176182.json')
multiplArtboardJsonToSketchFile([artboard, artboard1], './single.sketch')


