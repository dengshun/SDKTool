import iconv from 'iconv-lite'
const fs = require('fs')
const {exec} = require('child_process')
/**
 * @export
 * @param {String} src
 * @returns
 * @feature 读取文件夹信息
 */
export function getFolder (src) {
  return new Promise((resolve, reject) => {
    fs.readdir(src, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files)
      }
    })
  })
}
/**
 * @export
 * @param {String} path
 * @returns
 * @feature 读取文件内容
 */
export function readFolder (path) {
  return getFolder(path).then(filenames => {
    let result = []
    let promise = filenames.map(filename => {
      return getFileInfo(path + '/' + filename).then(stats => {
        result.push(stats)
      }).catch(err => {
        console.log(err)
      })
    })
    return Promise.all(promise).then(() => {
      console.log(result)
      return result
    }).catch(err => {
      return console.log(err)
    })
  })
}

/**
 * @export
 * @param {String} src
 * @returns
 * @feature 读取文件信息
 */
export function getFileInfo (src) {
  return new Promise((resolve, reject) => {
    fs.stat(src, (err, stats) => {
      if (err) {
        reject(err)
      } else {
        let temp = src.split('\\\\')
        let type = 'unknown'
        let seq = temp[temp.length - 1].split('.')

        // 类型
        let mime = seq[seq.length - 1]
        // 文件名
        stats.name = temp[temp.length - 1]
        if (stats.isDirectory()) {
          type = 'folder'
        } else {
          type = 'file'
        }
        stats.type = type
        stats.path = src
        stats.rename = false
        stats.mime = mime
        stats.location = stats.path.slice(0, stats.path.indexOf(stats.name))
        resolve(stats)
      }
    })
  })
}
/**
 * @export
 * @param {String} src
 * @param {Object} dialog
 * @param {Boolean} alert
 * @returns
 * @feature 删除文件夹
 */
export function deleteFolder (src, dialog, alert) {
  let buttons = ['OK', 'Cancel']
  let title = '删除文件夹'
  let infoSuccess = '删除 ' + src + ' 成功!'
  let message = '确认要删除吗? 此操作不可逆!'
  return new Promise((resolve, reject) => {
    if (alert !== false) {
      dialog.showMessageBox({
        type: 'question',
        title: title,
        buttons: buttons,
        message: message
      }, index => {
        if (index === 0) {
          exec(`rmdir "${src}" /S /Q`, {
            encoding: 'GB2312'
          }, (err, stdout, stderr) => {
            if (err || iconv.decode(stderr, 'GB2312')) {
              dialog.showErrorBox(iconv.decode(stderr, 'GB2312'), iconv.decode(stdout, 'GB2312'))
              reject(iconv.decode(stderr, 'GB2312'))
            } else {
              dialog.showMessageBox({title: infoSuccess, detail: infoSuccess, type: 'info', buttons: ['OK']})
              resolve()
            }
          })
        }
      })
    } else {
      exec(`rmdir "${src}" /S /Q`, {
        encoding: 'GB2312'
      }, (err, stdout, stderr) => {
        if (err || iconv.decode(stderr, 'GB2312')) {
          dialog.showErrorBox(iconv.decode(stderr, 'GB2312'), iconv.decode(stdout, 'GB2312'))
          reject(iconv.decode(stderr, 'GB2312'))
        } else {
          resolve()
        }
      })
    }
  })
}
export function deleteFolderSyncByfs(path){
  if( fs.existsSync(path) ) {
      let files = [];
      files = fs.readdirSync(path);
      files.forEach(function(file,index){
      let curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
          deleteFolderSyncByfs(curPath);
       } else { // delete file
            fs.unlinkSync(curPath);
       }
       });
       fs.rmdirSync(path);
   }
}
