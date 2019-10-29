# sketch-transform
Transform sketch files to json and json to sketch files

## Usage

```
const { Sketch2json, readAndParseFileInSketch, sketchJsonToSketchFile } = require('./lib/index.js')
const fs = require('fs')
const fse = require('fs-extra')
// Document Meta User Page Image Preview

// Get a JSON output out of a buffer of Sketch v43+ data
Sketch2json('./sketch-examples/test.sketch', {
  single: true,
  output: `${__dirname}/dist/`
}).then(() => {
  console.error('Sketch2json 解压 sketch file 完成！！')
})


// files to sketch files
readAndParseFileInSketch('./output/')


// json to sketch files
const singleSketchJson = fse.readJsonSync('./test-json/single-sketch.json')
const preview = fse.readFile('./test-json/preview.png')
const images = [{
  '38ca6125035f10996026c761d9779f85c8d1f99e.png': fse.readFile('./test-json/38ca6125035f10996026c761d9779f85c8d1f99e.png')
}]
const output = './single.sketch'
sketchJsonToSketchFile({ sketchJson: singleSketchJson, preview, images }, output)

```

## Sketch File format

Sketch documents are stored as ZIP archives containing JSON encoded data. The file format was originally [introduced in Sketch 43](https://sketchplugins.com/d/87-new-file-format-in-sketch-43) and allows for better third-party integration. Generate Sketch documents dynamically, read or modify them without opening them in Sketch.

The JSON files within the archive describe the document data and contain a number of binary assets such as bitmap images and document preview. To unarchive a document on the command line use `unzip`.

```
unzip document.sketch
```

Archive the contents of a document folder with `zip`.

```
zip -r -X document.sketch *
```

## Folder structure

### **`meta.json`**

Contains metadata about the document itself (a list of pages and artboards, Sketch version used to save the file, fonts used…). It’s equivalent to the output you’d get from running `sketchtool metadata` on the file.

### **`document.json`**

Contains common data for all pages of a document, like shared styles, and a link to the JSON files in the `pages`folder.

### **`user.json`**

Contains user metadata for the file, like the canvas viewport & zoom level for each page, UI metadata for the app such as panel dimensions, etc. and whether the document has been uploaded to Sketch Cloud.

### **`pages` folder**

Contains a JSON file per page of the document. Each file describes the contents of a page, in a format similar to what you’d get by running `sketchtool dump` on the file.

### **`images` folder**

The `images` folder contains all the bitmaps that are used in the document, at their original scales (so if the user imported a 1000x1000px image and then resized it to 200x200px, the full 1000x1000px file will be stored).

### **`previews` folder**

Contains a preview image of the last page edited by the user. If the page’s size is less than 2048x2048 it will be stored at full size, otherwise it’ll be scaled to fit a 2048x2048 square.

## Custom data

To store data that is not part of the Sketch document structure a special field `userInfo` object can be set per document and layer.

```
{
  "userInfo": {
    "com.example.custom.value": {
      "comment": "Looking great 👏"
    }
  }
}
```

You can also use the [Sketch JavaScript API](https://developer.sketch.com/reference/api/#settings) to set custom data. Please note that the values will be set for the current plugin or script identifier.

```
const settings = require('sketch/settings')

let document = require('sketch/dom').Document
settings.setDocumentSettingForKey(document, 'comment', 'Done!')

let layer = context.selection[0]
settings.setLayerSettingForKey(layer, 'comment', 'Looking great 👏')
```

## Related resources

- [ Render React components to Sketch](https://github.com/airbnb/react-sketchapp)

- [sketch-file -- A Sketch file is a zip file containing a bunch of JSON files.](https://github.com/Lona/sketch-file)

- [sketch2json -- Get a JSON output out of a buffer of Sketch v43+ data](https://github.com/xaviervia/sketch2json)

- [sketch-constructor -- Read/write/manipulate Sketch files in Node without Sketch plugins](https://github.com/amzn/sketch-constructor)

- [How we learned to read and write Sketch app data format](https://blog.avocode.com/how-we-learned-to-read-and-write-sketch-app-data-format-ecf711e19c47)
