const fs = require('fs')
const path = require('path')
const EXEC = require('child_process').exec
const sketch2json = require('sketch2json')
const tmp = require('tmp')
const fse = require('fs-extra')
const glob = require('glob')
const chalk = require('chalk')
const unzip = require('unzip')
const JSZip = require('jszip')
const { writeSketchFile, readAndParseFileInZip } = require('../sketch-file')


const globFile = src => new Promise((resolve, reject) => {
  glob(src, {}, function (er, files) {
    if (er) {
      reject([])
      return
    }
    resolve(files)
  })
})

/**
 * @function Sketch2json  解压 sketch 文件到 json
 * @param {*} filePath
 * @param {*} opts
 */
module.exports.Sketch2json = (filePath, opts = { single: false, output: './dist/' }) => {
  if (path.extname(filePath).toLowerCase !== '.sketch') throw new TypeError(`${chalk.red('Files must be an sketch file!')}`)
  const { single, output } = opts
  if (single) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (error, data) => {
        if (error) reject('')
        sketch2json(data).then(result => {
          fse.writeJsonSync(path.join(output, 'output.json'), result)
          resolve()
        })
      })
    })
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath).pipe(unzip.Extract({ path: output }))
      .on('error', reject)
      .on('finish', resolve)
  })
}


/**
 * readAndParseFileInSketch 读取 sketch 解压文件路径生成 sketch 文件
 * @param {*} src
 */
module.exports.readAndParseFileInSketch = async src => {
  const Zip = new JSZip()
  const files = await globFile(`${src}**`)

  const regexp = new RegExp(`${path.join(src, 'pages/')}*`, 'g')

  if (!(files.find(d => path.join(d) === path.join(src, 'document.json')) && files.find(d => path.join(d) === path.join(src, 'meta.json')) && files.find(d => path.join(d) === path.join(src, 'user.json')) && files.find(d => regexp.test(path.join(d))))) {
    throw new TypeError(`${chalk.red('Files must contain document, meta, user and page!')}`)
  }

  Zip
    .file('meta.json', fs.readFileSync(path.join(src, 'meta.json')))
    .file('user.json', fs.readFileSync(path.join(src, 'user.json')))
    .file('document.json', fs.readFileSync(path.join(src, 'document.json')))

  Zip.folder('pages')
  Zip.folder('previews')
  Zip.folder('images')

  const previews = path.join(src, 'previews/preview.png')
  const images = path.join(src, 'images/')
  const pages = path.join(src, 'pages/')

  if (fse.existsSync(previews)) { Zip.file(path.join('previews/', 'preview.png'), fse.readFile(previews)) }

  if (fse.existsSync(images)) {
    fse.readdirSync(images).forEach(file => {
      Zip.file(path.join('images/', file), fse.readFile(path.join(images, file)))
    })
  }

  fse.readdirSync(pages).forEach(file => {
    Zip.file(path.join('pages/', file), fse.readFile(path.join(pages, file)))
  })

  // files.map(file => {
  //   file = path.join(file)
  //   const imgRegexp = new RegExp(`${path.join(src, 'images/')}*`, 'g')
  //   if (/images/.test(file)) {
  //     console.error('file', file)
  //   }
  // })

  Zip.generateAsync({ type: 'nodebuffer', streamFiles: true }).then(buffer => {
    fs.writeFileSync('./tone.sketch', buffer)
    console.error('finish')
  })
}

/**
 * sketchJsonToSketchFile 根据sketch json 数据生成 sketch 文件
 * @param {*} json
 * @param {*} preview
 * @param {*} images
 */
module.exports.sketchJsonToSketchFile = async (sketchJson = {}, preview = '', images = []) => {
  const {
    document = {},
    meta = {},
    user = {},
    page = {},
  } = sketchJson

  const Zip = new JSZip()
  Zip
    .file('meta.json', JSON.stringify(meta))
    .file('user.json', JSON.stringify(user))
    .file('document.json', JSON.stringify(document))
}
