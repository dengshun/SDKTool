import Vue from 'vue'
const {exec} = require('child_process')
export function execCMD (cmdStr) {
    console.log(cmdStr);
  return new Promise((resolve, reject) => {
    exec(`${cmdStr}`, function (error, stdout, stderr) {
        console.log(error)
        if (error !== null) {
        //   Vue.prototype.$Notice.error({
        //     title: '命令行错误',
        //     duration: 2
        //   })
            reject(error);
        } else {
            resolve(stdout);
        }
    });
  }
  );

//   exec(`${cmdStr}`, function (error, stdout, stderr) {
//     console.log(error)
//     if (error !== null) {
//     //   Vue.prototype.$Notice.error({
//     //     title: '命令行错误',
//     //     duration: 2
//     //   })
//     } else {
//       alert('done!')
//     }
//   });
}
