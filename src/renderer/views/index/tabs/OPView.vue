<template>
    <div>
        <div class="tabDiv">
            <button v-on:click="selectAPKHandler" v-bind:disabled="selectAPKBtnDisabled" class="btn btn-sm btn-success">选择APK文件</button>
            <button v-on:click="selectSDKCfgFile" v-bind:disabled="selectConfigDisabled" class="btn btn-sm btn-success">选择渠道文件</button>
            <button v-on:click="packHandler" v-bind:disabled="packBtnDisabled" class="btn btn-sm btn-success">生成APK</button>
        </div>
        <div class="labelDiv">
            <label class="col-sm col-form-label titleLab">
                安卓平台：基本信息
            </label>
            <div class="line2">
            </div>
        </div>
        <div class='infoDiv'>
            <div class="infoTable">
                <table>
                    <tr>
                        <td>文件名称：</td>
                        <td class="td2">{{appName}}</td>
                    </tr>
                    <tr>
                        <td>游戏版本：</td>
                        <td class="td2">{{originalVersionName}}</td>
                    </tr>
                    <tr>
                        <td>游戏包名：</td>
                        <td class="td2">{{originalPackageName}}</td>
                    </tr>
                    <tr>
                        <td>闪屏信息：</td>
                        <td class="td2">{{originalSplashDesc}}</td>
                    </tr>
                </table>
            </div>
            <div>
                <div>
                    <label class="col-sm col-form-label titleLab">图标</label>
                </div>
                <div>
                    <myImage :src="iconUrl" width="60" height="60" />
                </div>
                <div>
                    <button v-on:click="selectIconHandler" v-bind:disabled="selectIconBtnDisabled" class="btn btn-sm btn-success icoSelectBtn">修改图标</button>
                </div>
            </div>
            <div v-for="(splashItem,index) in originalSplashList" v-bind:key="splashItem.id">
                <div>
                    <label class="col-sm col-form-label titleLab">闪屏{{index+1}}</label>
                </div>
                <div>
                    <myImage :src="splashItem.showUrl" width="60" height="60" />
                </div>
                <div>
                    <button @click="selectSplashHandler(splashItem)" v-bind:disabled="selectIconBtnDisabled" class="btn btn-sm btn-success icoSelectBtn">修改闪屏</button>
                </div>
            </div>
        </div>
        <div class="labelDiv">
            <label class="col-sm col-form-label titleLab">
                安卓平台：打包信息
            </label>
            <div class="line2">
            </div>
        </div>
        <div class='infoDiv'>
            <div class="infoTable">
                <table>
                    <tr>
                        <td>游戏名称：</td>
                        <td class="td2">{{misGameName}}</td>
                    </tr>
                    <tr>
                        <td>SDK名称：</td>
                        <td class="td2">{{misSDKName}}</td>
                    </tr>
                    <tr>
                        <td>SDK版本：</td>
                        <td class="td2">{{misSDKVer}}</td>
                    </tr>
                    <tr>
                        <td>渠道包名：</td>
                        <td class="td2">{{misPackage}}</td>
                    </tr>
                    <tr>
                        <td>推广渠道：</td>
                        <td class="td2">{{misChannelName}}</td>
                    </tr>
                </table>
            </div>
        </div>   
        <div class="labelDiv">
            <label class="col-sm col-form-label titleLab">
                日志信息
            </label>
            <div class="line2">
            </div>
        </div>
        <div class="logDiv">
            <textarea id="logTextArea" class="form-control logTextArea" rows="10" disabled="disabled" v-model="logStr"></textarea>
        </div>
    </div>
</template>

<script>
import { getFolder, readFolder, getFileInfo } from "../../../common/file"
import { execCMD } from "../../../common/cmd"
import MyImage  from "../../../components/MyImage"
import global_ from "../../../Global"
import Vue from "vue"
import APKManifest from "../../../common/manifest/APKManifest"
import ValueXML from "../../../common/valueXML"
import SDKInfo from "../../../common/SDKInfo"
const archiver = require('archiver');
const extract = require('extract-zip')
const path = require("path")
const { dialog, app } = require("electron").remote
const ipc = require("electron").ipcRenderer
const fs = require("fs-extra")
const Jimp = require("jimp")
const xml2js = require("xml2js")
const os = require("os")
const sizeOf = require("image-size")
const shell = require("electron").shell;
export default {
  name: "opView",
  data: function() {
    return {
      logStr: "",
      appName: "",
      selectAPKBtnDisabled: false,
      selectConfigDisabled: true,
      packBtnDisabled: true,
      selectIconBtnDisabled: true,
      iconUrl: "",
      sdkInfo:null,
      originalAPKName: "",
      originalIconName: "",
      originalRawManifest: null,
      originalIconPaths: [],
      originalVersionName: "",
      originalPackageName: "",
      originalSplashDesc: "",
      originalSplashOrientation: "",
      originalSplashCount: "",
      originalSplashIntervalTime: "",
      originalSplashList: [],
      originalSplashUrls: [],
      originalSplashUrls2: [],
      originalAPKManafest:null,
      misGameName:"",
      misSDKName:"",
      misSDKVer:"",
      misPackage:"",
      misChannelName:"",
    }
  },
  components: {
   myImage:MyImage
  },
  watch:{
    logStr(){
      this.$nextTick(() => {
        var container = this.$el.querySelector("#logTextArea");
        container.scrollTop = container.scrollHeight;
      })
    }
  },
  mounted: async function() {
    // ipc.send("get-app-path")
    // ipc.on("got-app-path", (event, path) => {
    //     console.log(
    //         "==============================================================================:",
    //         path
    //     )
    // })
    // console.log(app.getPath('userData'))

    //  execCMD(
    //   `pwd`
    // ).then(stdout => {
    //   console.log(stdout)
    // })
  },
  methods: {
    unzipAPK(apkPath, outputPath) {
      this.selectAPKBtnDisabled = this.selectConfigDisabled = this.packBtnDisabled = true
      this.selectIconBtnDisabled = true
      this.logStr += "系统导入游戏包中......\n"
      this.logStr += "开始解压apk, 此过程可能需要几分钟, 请耐心等待...\n"
      execCMD(
        `${this.joinSpaceInPath(global_.javaPath)} -jar ${this.joinSpaceInPath(
          global_.apktoolPath
        )} d ${this.joinSpaceInPath(apkPath)} -o ${this.joinSpaceInPath(
          outputPath
        )}`
      ).then(stdout => {
        this.logStr += "解压完成...\n"
        this.selectAPKBtnDisabled = this.selectConfigDisabled = this.packBtnDisabled = false
        this.selectIconBtnDisabled = false
        let parser = new xml2js.Parser()
        fs.readFile(
          path.join(outputPath, "AndroidManifest.xml"),
          (err, data) => {
            parser.parseString(data, (err, result) => {
              this.originalRawManifest = result
              // console.log("sdfsdfsdf:"+xmlbuilder.create(result));
              this.originalAPKManafest=new APKManifest();
              this.originalAPKManafest.initData(result);
              let tmpAppName =
                result.manifest.application[0]["$"]["android:label"]
              if (tmpAppName[0] === "@") {
                this.readAppNameFromStringsXML(
                  path.join(outputPath, "res", "values", "strings.xml"),
                  tmpAppName.substr(tmpAppName.indexOf("/") + 1)
                )
              } else {
                this.appName = tmpAppName
              }
              this.originalPackageName = result.manifest["$"]["package"]
              this.originalIconName =
                result.manifest.application[0]["$"]["android:icon"]
              this.originalIconName = this.originalIconName.substr(
                this.originalIconName.indexOf("/") + 1
              )
              this.readSpashInfo(result)
              this.findAllIconAndSplashPath(outputPath)

              let splashs = []
              console.log(this.originalSplashUrls)
              for (let splashFolderKey in this.originalSplashUrls) {
                console.log(splashFolderKey)
                console.log(this.originalSplashUrls[splashFolderKey])
                let splashArr = this.originalSplashUrls[splashFolderKey]
                if (splashArr.length > 0) {
                  let splashId = 1
                  for (let splashImg of splashArr) {
                    splashs.push({
                      id: splashId,
                      url: splashImg,
                      showUrl: splashImg
                    })
                    splashId++
                  }
                  break
                }
              }
              this.originalSplashList = splashs
              this.iconUrl = this.originalIconPaths[0]
            })
          }
        )
      })
    },
    readAppNameFromStringsXML(xmlPath, propName) {
      let parser = new xml2js.Parser()
      fs.readFile(xmlPath, (err, data) => {
        parser.parseString(data, (err, result) => {
          let strings = result.resources.string
          for (let stringObj of strings) {
            if (stringObj["$"].name === propName) {
              console.log(stringObj["_"])
              this.appName = stringObj["_"]
            }
          }
        })
      })
    },
    readSpashInfo(xmlObj) {
      let hasSpash = false
      let list = xmlObj.manifest.application[0]["activity"]
      for (let activity of list) {
        if (
          activity["$"]["android:name"] ===
          "com.uwan.base.splash.SplashActivity"
        ) {
          this.originalSplashOrientation =
            activity["$"]["android:screenOrientation"]
          let filters = activity["intent-filter"]
          if (filters && filters.length > 0) {
            let intentFilter = filters[0]
            let actions = intentFilter["action"]
            let categorys = intentFilter["category"]
            if (
              actions &&
              categorys &&
              actions.length > 0 &&
              categorys.length > 0
            ) {
              for (let category of categorys) {
                if (
                  category["$"]["android:name"] ===
                  "android.intent.category.LAUNCHER"
                ) {
                  hasSpash = true
                  break
                }
              }
            }
          }
          if (hasSpash) {
            break
          }
        }
      }
      let metaDataList = xmlObj.manifest.application[0]["meta-data"]
      for (let metaData of metaDataList) {
        if (metaData["$"]["android:name"] === "uwan_splash_imagecard_flag") {
          this.originalSplashCount = metaData["$"]["android:value"]
        } else if (metaData["$"]["android:name"] === "uwan_splash_time") {
          this.originalSplashIntervalTime = metaData["$"]["android:value"]
        }
      }
      this.originalSplashDesc =
        (this.originalSplashOrientation === "landscape" ? "横屏" : "竖屏") +
        ",闪屏数量:" +
        this.originalSplashCount +
        ",闪屏播放间隔:" +
        this.originalSplashIntervalTime +
        "毫秒"
    },
    selectAPKHandler() {
      dialog.showOpenDialog(
        {
          properties: ["openFile"],
          filters: [{ name: "apk", extensions: ["apk"] }]
        },
        files => {
          if (files) {
            this.logStr="";
            this.sdkInfo=null;
            this.updateMisInfo();
            let filePath = files[0]
            let baseName = path.basename(filePath).split(".")[0]
            this.originalAPKName = baseName
            fs
              .remove(global_.workBasePath)
              .then(() => {
                console.log("empty dir success!")
                mkdirAndunzip()
              })
              .catch(err => {
                console.error("empty dir error:" + err)
                mkdirAndunzip()
              })
            let self = this
            let mkdirAndunzip = function() {
              fs.mkdirSync(global_.workBasePath)
              fs.mkdirSync(path.join(global_.workBasePath, "original"))
              fs.mkdirSync(path.join(global_.workBasePath, "new"))
              fs.mkdirSync(path.join(global_.workBasePath, "sdk"))
              fs.mkdirSync(path.join(global_.workBasePath, "new", "icon"))
              fs.mkdirSync(path.join(global_.workBasePath, "new", "splash"))
              fs.mkdirSync(path.join(global_.workBasePath, "new", "gen"))
              fs.mkdirSync(path.join(global_.workBasePath, "new", "smali"))
              fs.mkdirSync(path.join(global_.workBasePath, "new", "mis"))
              fs.mkdirSync(path.join(global_.workBasePath, "new", "pack"))
              
              let toPath = path.join(
                global_.workBasePath,
                "original",
                "gameClient"
              )
              self.readAPKInfo(files[0])
              self.unzipAPK(files[0], toPath)
            }
          }
        }
      )
    },
    selectIconHandler() {
      dialog.showOpenDialog(
        {
          properties: ["openFile"],
          filters: [{ name: "Icon", extensions: ["png"] }]
        },
        files => {
          if (files) {
            let filePath = files[0]
            this.logStr += `开始导入图标，图标路径为：${filePath}\n`

            this.iconUrl = ""
            let toPath = path.join(
              global_.workBasePath,
              "new",
              "icon",
              "default.png"
            )
            let showPath = path.join(
              global_.workBasePath,
              "new",
              "icon",
              "show.png"
            )
            try {
              fs.copySync(filePath, toPath)
              console.log("success!")
            } catch (err) {
              console.error(err)
            }
            this.logStr += "图标导入成功\n"
            Jimp.read(toPath)
              .then(img => {
                img.resize(96, 96,Jimp.RESIZE_NEAREST_NEIGHBOR).write(showPath, (err, img) => {
                  this.iconUrl = showPath
                })
              })
              .catch(err => {
                console.error(err)
              })
          }
        }
      )
    },
    selectSplashHandler(item) {
      console.log(item.url, "====", item.id)
      let baseName = path.basename(item.url)
      dialog.showOpenDialog(
        {
          properties: ["openFile"],
          filters: [
            { name: "splash image", extensions: ["png", "jpg", "jpeg"] }
          ]
        },
        files => {
          if (files) {
            let filePath = files[0]
            this.logStr += `开始导入闪屏${item.id}，图标路径为：${filePath}\n`
            let toPath = path.join(
              global_.workBasePath,
              "new",
              "splash",
              baseName
            )
            try {
              fs.copySync(filePath, toPath)
              console.log("copy success:", toPath)
            } catch (err) {
              console.error(err)
            }
            this.logStr += `闪屏${item.id}导入成功\n`
            item.url = toPath
            item.showUrl = toPath
          }
        }
      )
    },
    findAllIconAndSplashPath(basePath) {
      this.originalSplashUrls = {}
      let files = fs.readdirSync(path.join(basePath, "res"))
      for (let fileName of files) {
        if (
          fileName.indexOf("drawable") >= 0 ||
          fileName.indexOf("mipmap") >= 0
        ) {
          let filePath = path.join(basePath, "res", fileName)
          let stats = fs.statSync(filePath)
          if (stats.isDirectory()) {
            let splashUrlArr = []
            this.originalSplashUrls[fileName] = splashUrlArr
            let files2 = fs.readdirSync(filePath)
            for (let fileName2 of files2) {
              let fullPath = path.join(filePath, fileName2)
              if (fileName2.indexOf(this.originalIconName) >= 0) {
                console.log(fullPath)
                this.originalIconPaths.push(fullPath)
                // this.iconUrl = fullPath
              } else if (
                fileName2.indexOf(
                  `uwan_splash_${this.originalSplashOrientation}`
                ) >= 0
              ) {
                splashUrlArr.push(fullPath)
                console.log(fullPath)
              }
            }
          }
        }
      }
    },
    readAPKInfo(apkPath) {
      // execCMD(`${global_.aaptPath} dump xmltree ${apkPath} AndroidManifest.xml`).then((stdout)=>{
      //     console.log(stdout)
      // })
      execCMD(
        `${this.joinSpaceInPath(
          global_.aaptPath
        )} dump badging ${this.joinSpaceInPath(apkPath)}`
      ).then(stdout => {
        console.log(stdout)
        let lines = stdout.split("\n")
        for (let lineStr of lines) {
          if (lineStr.indexOf("package:") >= 0) {
            console.log("==========::::"+lineStr);
            let packageLineParts = lineStr.split(" ")
            for (let partStr of packageLineParts) {
              let pair = partStr.split("=")
              if (pair[0] === "versionName") {
                this.originalVersionName = pair[1].substr(
                  1,
                  pair[1].length - 2
                )
              } else if (pair[0] === "name") {
                this.originalPackageName = pair[1].substr(
                  1,
                  pair[1].length - 2
                )
              }
            }
          } else if (lineStr.indexOf("application-label:") >= 0) {
            let tmpAppName = lineStr.split(":")[1]
            tmpAppName = tmpAppName.substr(1, tmpAppName.length - 2)
            this.appName = tmpAppName
          }
        }
      })
    },
    packHandler() {
      this.selectAPKBtnDisabled = this.selectConfigDisabled = this.packBtnDisabled = true
      this.selectIconBtnDisabled=true;
      this.logStr += "拷贝游戏文件中，该过程可能需要您等待几分钟…………………………\n";
      let assetsPath=path.join(global_.workBasePath, "original", "gameClient","assets");
      const filterFunc = (src, dest) => {
          if(src.indexOf(assetsPath)>=0){
            return false;
          }
          return true;
      }
      fs.copy(
        path.join(global_.workBasePath, "original", "gameClient"),
        path.join(global_.workBasePath, "new", "gameClient"), { filter: filterFunc },
        err => {
          this.logStr += "拷贝游戏文件结束"
          this.pack_copyIcon().then(() => {
            this.pack_copySplash().then(() => {
              if(this.sdkInfo){
                if(this.sdkInfo.sdkId!==""){
                  this.copySDK().then(()=>{
                    this.copyUwanCfg().then(()=>{
                      this.modifyGameName().then(()=>{
                        this.modifyPackage().then(()=>{
                          this.mergeManifest().then(()=>{
                            this.createR().then(()=>{
                              this.packAPK();
                            });
                          });
                        })
                      });
                    });
                  });
                }else{
                  this.copyUwanCfg().then(()=>{
                    this.modifyGameName().then(()=>{
                      this.modifyPackage().then(()=>{
                        this.packAPK();
                      });
                    });
                  });
                }
              }else{
                this.packAPK();
              }
            })
          })
        }
      )
    },
    pack_copyIcon() {
      return new Promise((resolve, reject) => {
        this.logStr += "处理游戏图标.............\n"
        if (this.iconUrl && this.originalIconPaths.indexOf(this.iconUrl) < 0) {
          let newIconPath = path.join(
            global_.workBasePath,
            "new",
            "icon",
            "default.png"
          )
          Jimp.read(newIconPath)
            .then(img => {
              copyIcon(img)
            })
            .catch(err => {
              console.error(err)
              this.logStr += "游戏图标处理完成.............\n"
              console.log("pack icon complete.......................\n")
              resolve()
            })
          let self = this
          let copyIcon = function(srcImg) {
            let iconPath = self.originalIconPaths.pop()
            if (iconPath) {
              let newpath = iconPath.split("original").join("new")
              let dimensions = sizeOf(newpath)
              srcImg
                .resize(dimensions.width, dimensions.height,Jimp.RESIZE_NEAREST_NEIGHBOR)
                .write(newpath, (err, img) => {
                  copyIcon(srcImg)
                })
            } else {
              this.logStr += "游戏图标处理完成.............\n"
              console.log("pack icon complete.......................\n")
              resolve()
            }
          }
        } else {
          this.logStr += "游戏图标处理完成.............\n"
          console.log("pack icon complete.......................\n")
          resolve()
        }
      })
    },
    pack_copySplash() {
      return new Promise((resolve, reject) => {
        this.logStr += "处理游戏闪屏.............\n"
        let allURLs = []
        for (let splashFolderKey in this.originalSplashUrls) {
          let splashArr = this.originalSplashUrls[splashFolderKey]
          allURLs = allURLs.concat(splashArr)
        }
        console.log(allURLs)
        let self = this
        let copySplash = function() {
          let oldSplashPath = allURLs.pop()
          if (oldSplashPath) {
            let newSplashPath = oldSplashPath.split("original").join("new")
            let baseName = path.basename(oldSplashPath)
            let srcPath = path.join(
              global_.workBasePath,
              "new",
              "splash",
              baseName
            )
            if (fs.existsSync(srcPath)) {
              Jimp.read(srcPath)
                .then(srcImg => {
                  let dimensions = sizeOf(newSplashPath)
                  srcImg
                    .resize(dimensions.width, dimensions.height,Jimp.RESIZE_NEAREST_NEIGHBOR)
                    .write(newSplashPath, (err, img) => {
                      console.log("splash done:----", newSplashPath)
                      copySplash()
                    })
                })
                .catch(err => {
                  console.error(err)
                  copySplash()
                })
            } else {
              copySplash()
            }
          } else {
            self.logStr += "游戏闪屏处理完成.............\n"
            console.log("pack splash complete.......................\n")
            resolve()
          }
        }

        if (allURLs.length > 0) {
          copySplash()
        } else {
          self.logStr += "游戏闪屏处理完成.............\n"
          console.log("pack splash complete.......................\n")
          resolve()
        }
      })
    },
    packAPK() {
      this.logStr += "开始压缩apk包，该过程可能需要您等待几分钟…………………………\n"
      let apkName=this.sdkInfo?(`${this.sdkInfo.getAppName()}_${this.sdkInfo.getSDKName()}`):this.originalAPKName
      let outputRawPath=path.join(global_.workBasePath, "new", "pack","unsigned0.zip")
      let outputPath= this.joinSpaceInPath(outputRawPath)
      let sourcesPath = this.joinSpaceInPath(
        path.join(global_.workBasePath, "new", "gameClient")
      )
      execCMD(
        `${this.joinSpaceInPath(global_.javaPath)} -jar ${this.joinSpaceInPath(
          global_.apktoolPath
        )} b -a ${global_.aaptPath} ${sourcesPath} -o ${outputPath}`
      ).then(stdout => {
        setTimeout(() => {
          let extractPath = path.join(global_.workBasePath, "new", "pack","unsigned0_dir");
          extract(outputRawPath, { dir: extractPath }, err => {
            console.log("-@@@@@@@@@@@@:"+err);
            this.logStr += "apk包压缩成功...\n"
            this.mergeGameAssets()
          });
        },100);
        // this.signAPK()
      })
    },
    mergeGameAssets(){
      let toPath=path.join(global_.workBasePath, "new", "pack","unsigned0_dir","assets");
      let fromPath=path.join(global_.workBasePath, "original", "gameClient","assets")
      const filterFunc = (src, dest) => {
          if(src.split(path.sep).indexOf("uwan.cfg")>=0||src.split(path.sep).indexOf("uwansdk")>=0){
            if(fs.existsSync(dest)){
              return false;
            }
          }
          return true;
      }

      this.logStr += "整合assets资源...\n"
      fs.copy(
        fromPath,
        toPath, { filter: filterFunc },
        err => {
          this.logStr += "整合assets资源完成...\n"
          this.createNewUnsignedZipFile();
      })
    },
    createNewUnsignedZipFile(){
      let outputPath=path.join(global_.workBasePath, "new", "pack","unsigned1.zip");
      let output = fs.createWriteStream(outputPath);
      let archive = archiver('zip', {zlib: { level: 9 }});
      output.on('close', ()=> {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        this.signAPK();
      });
 
      output.on('end', ()=> {
        console.log('Data has been drained');
      });
      archive.pipe(output); 
      
      let sourcePath=path.join(global_.workBasePath, "new", "pack","unsigned0_dir");
      archive.directory(sourcePath, false)
      archive.finalize();
    },
    signAPK() {
      this.logStr += "apk开始签名……\n"
      let storePath = this.joinSpaceInPath(
        global_.keystorePath
      )
      let storePass = global_.keystorePass
      let alias = global_.keyAlias
      let keyPass = global_.keyAliasPass
      let apkPathRaw=path.join(global_.workBasePath, "new", "pack","unsigned1.zip")
      let apkPath = this.joinSpaceInPath(apkPathRaw)
      let outputPath=this.joinSpaceInPath(path.join(global_.workBasePath, "new", "pack","signed1.apk"))
      execCMD(
        `${this.joinSpaceInPath(global_.jarsignerPath)} -digestalg SHA1 -sigalg MD5withRSA -verbose -keystore ${storePath} -storepass ${storePass} -signedjar ${outputPath} ${apkPath} ${alias} -keypass ${keyPass}`
      ).then(stdout => {
        this.logStr += "apk包签名成功...\n"
        let apkName=this.sdkInfo?(`${this.sdkInfo.getAppName()}_${this.sdkInfo.getSDKName()}`):this.originalAPKName
        let releasePath = this.joinSpaceInPath(path.join(global_.outputPath,`${apkName}_signed.apk`))
        this.zipAlign(outputPath,releasePath).then(()=>{
          shell.showItemInFolder(releasePath);
          this.selectAPKBtnDisabled = this.selectConfigDisabled = this.packBtnDisabled = false;
          this.selectIconBtnDisabled=false;
        })
      })
    },
    joinSpaceInPath(path) {
      return path.replace(/ /g, "\\ ")
    },
    copySDK(){
      return new Promise((resolve, reject) => {
        this.removeRepeatValueXmlNode();
        let sdkPath=path.join(global_.workBasePath, "sdk",this.sdkInfo.sdkId,this.sdkInfo.sdkVersion);
        const filterFunc = (src, dest) => {
          if(path.dirname(src)===sdkPath&&(path.basename(src)==="AndroidManifest.xml"||path.basename(src)==="readme.txt")){
            return false;
          }
          return true;
        }
        this.logStr += `拷贝SDK(${this.sdkInfo.sdkId})文件\n`
        fs.copy(
          sdkPath,
          path.join(global_.workBasePath, "new", "gameClient"), { filter: filterFunc },
          err => {
            this.logStr += `拷贝SDK(${this.sdkInfo.sdkId})文件成功\n`
            resolve();
          }
        )
      });
    },
    copyUwanCfg(){
      return new Promise((resolve, reject) => {
        let from=path.join(global_.workBasePath, "new", "mis","uwan.cfg");
        if(fs.existsSync(from)){
          this.logStr += `拷贝uwan.cfg文件\n`
          let to=path.join(global_.workBasePath, "new", "gameClient","assets","uwan.cfg");
          fs.copy(
            from,to,
            err => {
              this.logStr += `拷贝uwan.cfg文件成功\n`
              resolve();
            }
          );
        }else{
            resolve();
        }
      });
    },
    mergeManifest(){
      return new Promise((resolve, reject) => {
        this.logStr += `合并AndroidManifest.xml\n`
        let parser = new xml2js.Parser()
        fs.readFile(path.join(global_.workBasePath, "sdk",this.sdkInfo.sdkId,this.sdkInfo.sdkVersion, "AndroidManifest.xml"),(err, data) => {
            parser.parseString(data, (err, result) => {
              let sdkManifest=new APKManifest();
              sdkManifest.initData(result);
              this.originalAPKManafest.mergeActivity(sdkManifest.activityNodes);
              this.originalAPKManafest.mergeMetaData(sdkManifest.metaDataNodes);
              this.originalAPKManafest.mergePermission(sdkManifest.usesPermissionNodes);
              fs.outputFile(path.join(global_.workBasePath, "new", "gameClient", "AndroidManifest.xml"), this.originalAPKManafest.makeXMLString(), err => {
                  console.log(err) // => null
                  this.logStr += `合并AndroidManifest.xml完成\n`
                  resolve();
              })
            }
          )
          }
        )
      });
    },
    createR(){
      return new Promise((resolve, reject) => {
        let genPath=this.joinSpaceInPath(path.join(global_.workBasePath, "new", "gen"));
        let smaliRawPath=path.join(global_.workBasePath, "new", "smali");
        let smaliPath=this.joinSpaceInPath(smaliRawPath);
        let resPath=this.joinSpaceInPath(path.join(global_.workBasePath, "new", "gameClient","res"));
        let androidJarPath=this.joinSpaceInPath(path.join(global_.toolsPath,"jar","android.jar"));
        let manifestPath=this.joinSpaceInPath(path.join(global_.workBasePath, "new", "gameClient", "AndroidManifest.xml"));
        let assetsPath=this.joinSpaceInPath(path.join(global_.workBasePath, "new", "gameClient", "assets"));
        execCMD(
          `${this.joinSpaceInPath(
            global_.aaptPath
          )}  package -f -m -J ${genPath} -S ${resPath} -I ${androidJarPath} -A ${assetsPath} -M ${manifestPath}`
        ).then(stdout => {
          console.log(stdout)
          console.log("R.java生成成功");
          let packageName=this.sdkInfo.getPackage()||this.originalPackageName;
          let rFilePath=path.join(genPath,...packageName.split("."),"R.java");
          console.log("====:"+rFilePath);
          let javacCMD;
          if (os.platform() === "win32") {
            javacCMD= `${this.joinSpaceInPath(global_.javacPath)} -encoding UTF-8 ${rFilePath}`;
          }else{
            javacCMD= `${this.joinSpaceInPath(global_.javacPath)} -encoding UTF-8 -source 1.7 -target 1.7  ${rFilePath}`;
          }
          execCMD(javacCMD).then(stdout=>{
            console.log(stdout);
            console.log("R.java编译成功");
            let dxJarPath=this.joinSpaceInPath(path.join(global_.toolsPath,"jar","dx.jar"));
            let rDexFilePath=this.joinSpaceInPath(path.join(global_.workBasePath, "new", "classes.dex"));
            let dexCMD=`${this.joinSpaceInPath(global_.javaPath)} -jar ${dxJarPath} --dex --output ${rDexFilePath} ${genPath}`;
            execCMD(dexCMD).then(stdout=>{
              console.log(stdout+"=-=-=-=-=-=-=-=-=-=-=");
              console.log("R class.dex 生成成功");
              let baksmaliJarPath=this.joinSpaceInPath(path.join(global_.toolsPath,"jar","baksmali.jar"));
              let smaliCMD=`${this.joinSpaceInPath(global_.javaPath)} -jar ${baksmaliJarPath} -o ${smaliPath} ${rDexFilePath}`;
              execCMD(smaliCMD).then(stdout=>{
                console.log("R smali 文件生成成功");
                fs.copySync(smaliRawPath,path.join(global_.workBasePath, "new", "gameClient","smali"));
                resolve();
              });
            });
          })
        });
      });
    },
    removeRepeatValueXmlNode(){
      let parser = new xml2js.Parser();
      let gameValueDict=this.collectGameValues();
      let pathStr=path.join(global_.workBasePath, "sdk",this.sdkInfo.sdkId,this.sdkInfo.sdkVersion,"res");
      let allFolders=fs.readdirSync(pathStr);
      for(let folderName of allFolders){
        if(folderName.indexOf("values")>=0){
          let subFolderPathStr=path.join(pathStr,folderName);
          let subFiles=fs.readdirSync(subFolderPathStr);
          for(let subFileName of subFiles){
            let subFilePathStr=path.join(subFolderPathStr,subFileName);
            let fileStr=fs.readFileSync(subFilePathStr);
            parser.parseString(fileStr,(err, result) => {
              let valueXML=new ValueXML();
              valueXML.initData(result);
              valueXML.removeRepeatChildNode(folderName,gameValueDict);
              if(valueXML.isDirty){
                  fs.outputFileSync(subFilePathStr, valueXML.makeXMLString());
                  console.log("valueXML 文件更新成功："+subFilePathStr);
              }
            });
          }
        }
      }
    },
    collectGameValues(){
      let parser = new xml2js.Parser();
      let dict={};
      let pathStr=path.join(global_.workBasePath, "original", "gameClient","res");
      let allFolders=fs.readdirSync(pathStr);
      for(let folderName of allFolders){
        if(folderName.indexOf("values")>=0){
          let subFolderPathStr=path.join(pathStr,folderName);
          let subFiles=fs.readdirSync(subFolderPathStr);
          for(let subFileName of subFiles){
            let subFilePathStr=path.join(subFolderPathStr,subFileName);
            let fileStr=fs.readFileSync(subFilePathStr);
            parser.parseString(fileStr,(err, result) => {
            let resourcesNode=result["resources"];
            let keyPrefix=folderName;
            for(let prop in resourcesNode){
              let key=keyPrefix+"##"+prop;
              let valueNodeList=resourcesNode[prop];
              for(let valueNode of valueNodeList){
                let key2=key+"##"+valueNode["$"]["name"];
                let value=valueNode["_"];
                if(!value){
                  value=valueNode["$"]["parent"];
                }
                dict[key2]=value;
              }
            }
            });
          }
        }
      }
      return dict;
    },
    selectSDKCfgFile(){
       dialog.showOpenDialog(
        {
          properties: ["openFile"],
          filters: [{ name: "zip", extensions: ["zip"] }]
        },
        files => {
          if (files) {
            let filePath = files[0];
            this.sdkInfo=new SDKInfo();
            this.selectAPKBtnDisabled = this.selectConfigDisabled = this.packBtnDisabled = true
            this.sdkInfo.initData(filePath,(logStr)=>{
              this.logStr +=logStr;
            }).then(()=>{
              this.selectAPKBtnDisabled = this.selectConfigDisabled = this.packBtnDisabled = false
              this.updateMisInfo();
            });
          }
        });
    },
    updateMisInfo(){
      this.misGameName="";
      this.misSDKName="";
      this.misSDKVer="";
      this.misPackage="";
      this.misChannelName="";
      console.log(this.sdkInfo,"==============",this.sdkInfo?this.sdkInfo.sdkId:"")
      if(this.sdkInfo){
        this.misGameName=this.sdkInfo.getAppName();
        this.misSDKName=this.sdkInfo.getSDKName();
        if(this.sdkInfo.sdkId){
          this.misSDKVer=this.sdkInfo.sdkId+" ("+this.sdkInfo.sdkVersion+")";
        }else{
          this.misSDKVer="无SDK";
        }
        this.misPackage=this.sdkInfo.getPackage();
        this.misChannelName=this.sdkInfo.getChannelName();
      }
    },
    modifyPackage(){
      return new Promise((resolve, reject) => {
        if(this.sdkInfo){
          let newPackage=this.sdkInfo.getPackage();
          if(newPackage&&newPackage!=this.originalPackageName){
            this.originalAPKManafest.modifyPackageName(newPackage);
            fs.outputFile(path.join(global_.workBasePath, "new", "gameClient", "AndroidManifest.xml"), this.originalAPKManafest.makeXMLString(), err => {
              console.log(err) // => null
              this.logStr += `游戏包名修改完成\n`
              resolve();
            })
          }else{
              resolve();
          }
        }else{
            resolve();
        }
      });
    },
    modifyGameName(){
      return new Promise((resolve, reject) => {
        let appLabel=this.originalAPKManafest.getAppLabel();
        if(appLabel.indexOf("@string")>=0){
            let stringValuePath=path.join(global_.workBasePath, "new", "gameClient","res","values","strings.xml");
            let fileStr=fs.readFileSync(stringValuePath);
            console.log(stringValuePath);
            let parser = new xml2js.Parser();
            parser.parseString(fileStr,(err, result) => {
              let valueXML=new ValueXML();
              valueXML.initData(result);
              valueXML.updateStringValueByAttr(appLabel.split("/")[1],this.misGameName);
              if(valueXML.isDirty){
                  fs.outputFile(stringValuePath, valueXML.makeXMLString(),err => {
                    if(!err){
                      this.logStr += `游戏名称修改成功：${this.misGameName}\n`;
                    }else{
                      this.logStr += `游戏名称修改失败：${this.misGameName}\n`;
                    }
                    resolve();
                  }) 
              }else{
                  resolve();
              }
            });
        }else{
          this.originalAPKManafest.updateAppLabel(this.misGameName);
          fs.outputFile(path.join(global_.workBasePath, "new", "gameClient", "AndroidManifest.xml"), this.originalAPKManafest.makeXMLString(),err => {
            if(!err){
              this.logStr += `游戏名称修改成功：${this.misGameName}\n`;
             }else{
               this.logStr += `游戏名称修改失败：${this.misGameName}\n`;
             }
             resolve();
          }); 
        }
      });
    },
    zipAlign(source,dest){
     return new Promise((resolve, reject) =>{
      this.logStr += "执行zip对齐命令…………………\n"
      execCMD(
            `${this.joinSpaceInPath(
              global_.zipalignPath
            )} -f 4 ${source} ${dest}`
          ).then(stdout => {
            this.logStr += "zip对齐命令执行完成…………………\n"
            resolve()
          });
      });
    }
  }
}
</script>

<style>
td {
  height: 35px;
}

.td2 {
  color: #ffffff;
}

.tabDiv {
  margin: 5px 5px 5px 15px;
}

.titleLab {
  display: inline-block;
  white-space: nowrap;
  font-weight: bold;
  color: #ffffff;
}

.labelDiv {
  display: flex;
  align-items: center;
}

.infoDiv {
  display: flex;
  margin: 0px 5px 5px 25px;
  font-size: 14px;
}
.infoDiv div {
  margin: 0px 5px 0px 5px;
}
.icoSelectBtn {
  margin: 10px 0px 0px 0px;
  font-size: 12px;
}

.infoTable {
}

.logDiv {
  margin: 0px 5px 5px 25px;
  font-size: 12px;
  height: 100%;
}

.line1 {
  margin: 5px 5px 0px 5px;
  border: 1px solid #969696;
  border-style: none none solid none;
  width: 100%;
  height: 5px;
}

.line2 {
  margin: 5px 5px 0px 0px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset;
  width: 100%;
  height: 2px;
}

.logTextArea {
  resize: none;
  font-size: 12px;
}
</style>