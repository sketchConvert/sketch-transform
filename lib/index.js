const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')
const glob = require('glob')
const chalk = require('chalk')
const sketch2json = require('sketch2json')
const unzip = require('unzip')
const JSZip = require('jszip')
const Document = require('../sketch-file/json/document')
const Meta = require('../sketch-file/json/meta')
const User = require('../sketch-file/json/user')
const Page = require('../sketch-file/json/page')
const { generateId } = require('../sketch-file/')

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
  if (path.extname(filePath).toLowerCase() !== '.sketch') throw new TypeError(`${chalk.red('Files must be an sketch file!')}`)
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
module.exports.sketchJsonToSketchFile = async ({ sketchJson = {}, preview = '', images = [] }, output) => {
  const {
    document = {},
    meta = {},
    user = {},
    pages = {},
  } = sketchJson

  const Zip = new JSZip()

  const pageIds = Object.keys(pages).map(d => ({
    id: d
  }))

  const docId = generateId()

  Zip
    .file('meta.json', JSON.stringify(Object.assign(Meta(pageIds), meta)))
    .file('user.json', JSON.stringify(Object.assign(User(pageIds), user)))
    .file('document.json', JSON.stringify(Object.assign(Document(docId, pageIds), document)))

  Zip.folder('pages')
  Zip.folder('previews')
  Zip.folder('images')


  if (preview)Zip.file(path.join('previews/', 'preview.png'), preview)
  images.map(item => {
    const key = Object.keys(item)[0]
    Zip.file(path.join('images/', `${key}`), item[key])
  })

  pageIds.map(({ id }) => {
    Zip.file(path.join('pages/', `${id}.json`), JSON.stringify(pages[id]))
  })

  Zip.generateAsync({ type: 'nodebuffer', streamFiles: true }).then(buffer => {
    fs.writeFileSync(output, buffer)
    console.error('finish')
  })
}


/**
 * traversalOutputImage 遍历 json 数据，导出base64 image本地化
 * @param {*} data
 * MSImageData
 */
const dealWith = (item, localImageCallBack) => {
  if (item.image && item.image._ref_class === 'MSImageData') {
    const file = item.image._ref

    // attention 存在重复数据，但没有 data 数据
    item.image._class = 'MSJSONFileReference'
    if (item.image.data && item.image.data._data && localImageCallBack) {
      const data64 = item.image.data._data
      // const extname = path.extname(file).replace('.', '')
      // switch (extname.toLowerCase()) {
      //   case 'png':
      //     data64 = `data:image/png;base64,${data64}`
      //     break
      //   case 'gif':
      //     data64 = `data:image/gif;base64,${data64}`
      //     break
      //   case 'jpg':
      //   case 'jpeg':
      //     data64 = `data:image/jpeg;base64,${data64}`
      //     break
      // }

      localImageCallBack(file, data64)
      if (item.image.sha1) delete item.image.sha1
      delete item.image.data
    }
  }
}
const traversalOutputLocalImage = (layers = [], localImageCallBack) => {
  layers.length > 0 && layers.forEach(item => {
    try {
      dealWith(item, localImageCallBack)

      if (item.style && Object.prototype.toString.call(item.style) === '[object Object]') {
        if (Array.isArray(item.style.fills)) {
          item.style.fills.length > 0 && item.style.fills.forEach(cell => {
            dealWith(cell, localImageCallBack)
          })
        }
      }

      if (item.layers && item.layers.length > 0) traversalOutputLocalImage(item.layers, localImageCallBack)
    } catch (error) {
      console.error(error)
    }
  })
}


/**
 * sketchJsonToSketchFile 根据sketch json 数据生成 sketch 文件
 * @param {*} json
 * @param {*} preview
 * @param {*} images
 */
module.exports.multiplArtboardJsonToSketchFile = async (artboards = [], output) => {
  if (artboards.length <= 0) throw new TypeError(`${chalk.red('artboards must be an array!')}`)

  try {
    artboards = artboards.map(({ root }) => {
      root.frame.y = 0
      return root
    })

    artboards = artboards.sort((a, b) => b.frame.x - a.frame.x)

    let edge = 0

    artboards.forEach(item => {
      const { x, width } = item.frame
      item.frame.x = edge
      edge += width + 100
    })


    const document = {}
    const meta = {}
    const user = {}
    const objectId = generateId()
    const pages = {
      [`${objectId}`]: Page({
        id: objectId,
        layers: artboards,
        name: ''
      }, 1)
    }

    // console.error('artboards', artboards)

    const Zip = new JSZip()

    const pageIds = [
      {
        id: objectId
      }
    ]

    const docId = generateId()

    Zip
      .file('meta.json', JSON.stringify(Object.assign(Meta(pageIds), meta)))
      .file('user.json', JSON.stringify(Object.assign(User(pageIds), user)))
      .file('document.json', JSON.stringify(Object.assign(Document(docId, pageIds), document)))

    Zip.folder('pages')
    Zip.folder('previews')
    Zip.folder('images')


    // if (preview)Zip.file(path.join('previews/', 'preview.png'), preview)
    // images.map(item => {
    //   const key = Object.keys(item)[0]
    //   Zip.file(path.join('images/', `${key}`), item[key])
    // })

    pageIds.map(({ id }) => {
      traversalOutputLocalImage(pages[id].layers, (file, base64) => {
        Zip.file(file, base64, { base64: true })
      })
      Zip.file(path.join('pages/', `${id}.json`), JSON.stringify(pages[id]))
    })

    await Zip.generateAsync({ type: 'nodebuffer', streamFiles: true }).then(buffer => {
      fs.writeFileSync(output, buffer)
      console.error('finish')
    })
  } catch (error) {
    console.error(error)
  }
}
