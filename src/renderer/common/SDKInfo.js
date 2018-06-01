import global_ from "../Global"
const path = require("path")
const fs = require("fs-extra")
const extract = require('extract-zip')
const http = require("http");
const request = require('request');
const progress = require('progress-stream');

function SDKInfo() {
    this.sdkInfoDict = {};
    this.sdkId = "";
    this.sdkVersion = "";

}
SDKInfo.prototype.getAppName = function() {
    if (this.sdkInfoDict) {
        return this.sdkInfoDict["appName"];
    }
    return "";
}
SDKInfo.prototype.getSDKName = function() {
    if (this.sdkInfoDict) {
        return this.sdkInfoDict["sdkName"];
    }
    return "";
}
SDKInfo.prototype.getPackage = function() {
    if (this.sdkInfoDict) {
        return this.sdkInfoDict["package"];
    }
    return "";
}
SDKInfo.prototype.getChannelName = function() {
    if (this.sdkInfoDict) {
        return this.sdkInfoDict["channelName"];
    }
    return "";
}
SDKInfo.prototype.initData = function(sdkCfgPath, logPrint) {
    return new Promise((resolve, reject) => {
        let extractPath = path.join(global_.workBasePath, "new", "mis");
        extract(sdkCfgPath, { dir: extractPath }, err => {
            let sdkRawInfo = fs.readFileSync(path.join(extractPath, "sdkInfo.cfg"), { encoding: "utf-8" });
            console.log("--------mis--------------", sdkRawInfo);
            let sdkRawInfoLines = sdkRawInfo.split("\n");
            for (let line of sdkRawInfoLines) {
                let pairs = line.split("=");
                this.sdkInfoDict[pairs[0]] = pairs[1];
            }
            this.sdkId = this.sdkInfoDict["sdkId"];
            if (parseInt(this.sdkId) <= 0) {
                logPrint(`SDK ID：${this.sdkId},无SDK..............\n`);
                this.sdkVersion = "";
                this.sdkId = "";
                resolve();
            } else {
                let sdkVer = '';
                http.get(`http://img.cdn.dx.uwan.com/android/sdks/${this.sdkId}/update.txt?version=${new Date().getTime()}`, (req, res) => {
                    req.on('data', (data) => {
                        sdkVer += data;
                    });
                    req.on('end', () => {
                        this.sdkVersion = sdkVer;
                        let sdkExtractPath = path.join(global_.workBasePath, "sdk", this.sdkId, sdkVer);
                        if (logPrint) {
                            logPrint(`SDK ID：${this.sdkId};SDK version:${sdkVer}..............\n`);
                        }
                        if (!fs.existsSync(sdkExtractPath)) {
                            let sdkPath = path.join(global_.workBasePath, "sdk");
                            fs.emptyDirSync(sdkPath);
                            let zipToPath = path.join(sdkPath, "tmp.zip");
                            let zipStream = fs.createWriteStream(zipToPath);
                            if (logPrint) {
                                logPrint(`开始下载SDK..............\n`)
                            }
                            let req = request(`http://img.cdn.dx.uwan.com/android/sdks/${this.sdkId}/${sdkVer}.zip`).on('response', (resp) => {
                                console.log("resp..............................");
                                let len = resp.headers['content-length'];
                                let progressor = progress({
                                    length: len,
                                    time: 100
                                });
                                progressor.on('progress', (progress) => {
                                    console.log(Math.round(progress.percentage) + '%');
                                    if (logPrint) {
                                        logPrint(`已下载...（${progress.percentage}%）\n`)
                                    }
                                });

                                req.pipe(progressor).pipe(zipStream).on('close', () => {
                                    console.log("下载SDK成功..............................");
                                    if (logPrint) {
                                        logPrint(`下载SDK成功..............\n`)
                                    }
                                    extract(zipToPath, { dir: sdkExtractPath }, err => {
                                        console.log("sdk解压完成");
                                        fs.removeSync(zipToPath);
                                        if (logPrint) {
                                            logPrint(`SDK解压完成..............\n`)
                                        }
                                        resolve();
                                    });
                                });
                            });
                        } else {
                            resolve();
                        }
                    });
                });
            }
        })
    })

}


export default SDKInfo;