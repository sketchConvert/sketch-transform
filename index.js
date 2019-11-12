
const { Sketch2json, readAndParseFileInSketch, sketchJsonToSketchFile, multiplArtboardJsonToSketchFile } = require('./lib/index.js')
const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')
const axios = require('axios')
const { dirSync, fileSync } = require('tmp')
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


const getArtboardsJson = async (urls = []) => {
  const requests = []
  urls.map(url => {
    const getJson = new Promise(resolve => {
      axios.get(url)
        .then(function (response) {
          // handle success
          resolve(response.data)
        })
        .catch(() => {
          resolve('')
        })
    })

    requests.push(getJson)
  })

  const result = await Promise.all(requests)
  return result
}


const artboardsJsonTransfromSketch = async urls => {
  const artboards = await getArtboardsJson(urls)

  const tmpFile = fileSync({ postfix: '.sketch', prefix: 'sketch_' })
  // console.error('tmpFile', tmpFile)
  await multiplArtboardJsonToSketchFile(artboards, './single.sketch')
  // console.error('fs.statSync(tmpFile)', fs.statSync(tmpFile.name))
  tmpFile.removeCallback()
}


artboardsJsonTransfromSketch([
  'http://storage.360buyimg.com/quark-platform/design/06acbf70-f564-11e9-a6c2-fd57ed176182.json',
  'http://storage.360buyimg.com/quark-platform/design/3c959080-f72b-11e9-8aed-f77013a4e0b0.json'
])
