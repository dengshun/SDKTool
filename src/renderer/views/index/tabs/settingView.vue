<template>
  <div id="settings">
    <div class="vDiv">

     <div class="hDiv">
        <label>
          依赖工具路径：
        </label>
      </div>
      <div class="col-sm-12 hDiv2">
        <input type="text" class="form-control input-sm"  v-model="toolsPath">
        <button class="btn btn-sm btn-success" v-on:click="selectToolsFolderHandler" >浏览...</button>
      </div>

      
      <div class="hDiv">
        <label>
          签名文件：
        </label>
        <div>
          <input type="radio" name="keystore" value="0" id="default" v-model="keyStoreSelctor"/>
          <label for="default">默认</label>
          <input type="radio" name="keystore" value="1" id="custom"  v-model="keyStoreSelctor"/>
          <label for="custom">配置</label>
        </div>
      </div>
      <div class="col-sm-12 hDiv2">
        <input type="text" class="form-control input-sm"  v-model="keystorePath" :disabled="keystoreInputDisabled">
        <button class="btn btn-sm btn-success" :disabled="keystoreInputDisabled" v-on:click="selectKeyStoreHandler">浏览...</button>
      </div>
      <div class="hDiv3">
        <label>
          密码：
        </label>
        <label>
          别名：
        </label>
        <label>
          别名密码：
        </label>
      </div>
      <div class="hDiv3">
        <input id="storePassInput" type="password" class="form-control input-sm" v-model="storePass">
        <input type="text" class="form-control input-sm" v-model="keystoreAlias">
        <input type="password" class="form-control input-sm" v-model="keyPass">
      </div>

      
       <div class="line2"/>

      <div class="hDiv">
        <label>
          输出路径：
        </label>
        <div>
          <input type="radio" name="output"  value="0" id="outputDefault" v-model="outputPathSelctor"/>
          <label for="outputDefault">默认</label>
          <input type="radio" name="output" value="1" id="outputCustom"  v-model="outputPathSelctor"/>
          <label for="outputCustom">配置</label>
        </div>
      </div>
      <div class="col-sm-12 hDiv2">
        <input type="text" class="form-control input-sm" :disabled="outputPathInputDisabled" v-model="outputPath">
        <button class="btn btn-sm btn-success" v-on:click="selectOutputFolderHandler" :disabled="outputPathInputDisabled">浏览...</button>
        <button class="btn btn-sm btn-success" v-on:click="openOutputDirectoryHandler">打开文件夹</button>
      </div>
      
      <button class="btn btn-sm btn-danger saveBtn" v-on:click="saveSettingHandler">保存</button>
    </div>
  </div>
</template>
<script>
import global_ from "../../../Global";
import iconv from "iconv-lite";
const shell = require("electron").shell;
const { dialog, app } = require("electron").remote;
const fs = require("fs-extra")
const path = require("path")
const os = require("os");
export default {
  name: "settingView",
  data: function() {
    return {
      outputPathSelctor: 0,
      keyStoreSelctor: 0,
      outputPathInputDisabled: false,
      toolsPath:"",
      outputPath: "",
      keystoreInputDisabled: false,
      keystorePath: "",
      keystoreAlias: "",
      storePass: "",
      keyPass: "",
      isDefaultOutputPath: true,
      isDefaultKeystore: true
    };
  },
  mounted: async function() {
    setTimeout(() => {
      this.updateSetting();
    }, 1000);
  },
  methods: {
    updateSetting() {
      this.toolsPath=global_.toolsPath;
      this.storePass = global_.keystorePass;
      this.keystoreAlias = global_.keyAlias;
      this.keyPass = global_.keyAliasPass;
      this.keystorePath = global_.keystorePath;
      this.outputPath = global_.outputPath;
      if (global_.keystorePath == global_.defaultKeystorePath) {
        this.keystoreInputDisabled = true;
        this.keyStoreSelctor = 0;
      } else {
        this.keystoreInputDisabled = false;
        this.keyStoreSelctor = 1;
      }
      if (global_.outputPath == global_.defaultOutputPath) {
        this.outputPathInputDisabled = true;
        this.outputPathSelctor = 0;
      } else {
        this.outputPathInputDisabled = false;
        this.outputPathSelctor = 1;
      }
    },
    updateGlobalSetting(){
      global_.toolsPath=this.toolsPath;
      global_.outputPath=this.outputPath;
      let apkTooltVer="2.2.2";
      global_.apktoolPath = path.join(global_.toolsPath, "jar","apktool",apkTooltVer,"apktool.jar");
      global_.jreBinPath = path.join(global_.toolsPath,  "jre", "bin");
      if (os.platform() === "win32") {
          global_.aaptPath = path.join(global_.toolsPath,"jar","apktool",apkTooltVer,"aapt.exe");
          global_.javaPath = path.join(global_.toolsPath,"jre","bin","java");
          global_.javacPath = path.join(global_.toolsPath,"jre","bin","javac");
          global_.jarsignerPath = path.join(global_.jreBinPath, "jarsigner");
          global_.zipalignPath= path.join(global_.toolsPath,"command","zipalign.exe");
      } else {
          global_.aaptPath = path.join(global_.toolsPath,"jar","apktool",apkTooltVer,"aapt");
          global_.javaPath = "java";
          global_.javacPath = "javac";
          global_.jarsignerPath = "jarsigner";
          global_.zipalignPath= path.join(global_.toolsPath,"command","zipalign");
      }

      global_.defaultKeystorePath=path.join(global_.toolsPath, "android", "default", "uwan.jks");
      global_.defaultKeystorePass='5221350';
      global_.defaultKeyAlias='key0';
      global_.defaultKeyAliasPass='5221350';

      global_.keystorePath=this.keystorePath;
      global_.keystorePass=this.storePass;
      global_.keyAlias=this.keystoreAlias;
      global_.keyAliasPass=this.keyPass;
    },
    selectToolsFolderHandler() {
      dialog.showOpenDialog(
        {
          properties: ["openDirectory"]
        },
        files => {
          console.log(files);
          this.toolsPath = files[0];
          if(this.keyStoreSelctor==0){
            let tmpKeystorePath=path.join(this.toolsPath, "android", "default", "uwan.jks");
            if(fs.existsSync(tmpKeystorePath)){
              this.keystoreInputDisabled = true;
              this.keystorePath=tmpKeystorePath;
              this.storePass='5221350';
              this.keystoreAlias='key0';
              this.keyPass='5221350';
            }else{
              this.keystoreInputDisabled = false;
              this.keyStoreSelctor = 1;
            }
          }
        }
      );
    },
    selectOutputFolderHandler() {
      dialog.showOpenDialog(
        {
          properties: ["openDirectory"]
        },
        files => {
          console.log(files);
          this.outputPath = files[0];
        }
      );
    },
    selectKeyStoreHandler() {
      dialog.showOpenDialog(
        {
          properties: ["openFile"],
          filters: [{ name: "key store", extensions: ["jks", "keystore"] }]
        },
        files => {
          console.log(files);
          this.keystorePath = files[0];
          this.storePass = "";
          this.keystoreAlias = "";
          this.keyPass = "";
        }
      );
    },
    openOutputDirectoryHandler() {
      if (this.outputPath) {
        shell.showItemInFolder(this.outputPath);
      }
    },
    saveSettingHandler() {
      if (
        this.toolsPath&&
        this.outputPath &&
        this.keystorePath &&
        this.storePass &&
        this.keystoreAlias &&
        this.keyPass
      ) {
        console.log("依赖工具路径：" + this.toolsPath);
        console.log("输出路径：" + this.outputPath);
        console.log("签名文件：" + this.keystorePath);
        console.log("签名文件密码：" + this.storePass);
        console.log("别名：" + this.keystoreAlias);
        console.log("别名密码：" + this.keyPass);
        let setting = {
          type: "setting",
          data: {
            keystorePass: this.storePass,
            keyAlias: this.keystoreAlias,
            keyAliasPass: this.keyPass,
            keystorePath: this.keystorePath,
            outputPath: this.outputPath,
            toolsPath:this.toolsPath,
          }
        };
        this.$db.preferences.update({ type: "setting" }, setting, {
          upsert: true
        });
        this.updateGlobalSetting();
      } else {
        if (!this.toolsPath) {
          dialog.showErrorBox("出错了", "依赖工具路径不能为空");
        } else if (!this.outputPath) {
          dialog.showErrorBox("出错了", "输出路径不能为空");
        } else if (!this.keystorePath) {
          dialog.showErrorBox("出错了", "签名文件路径不能为空");
        } else if (!this.storePass) {
          dialog.showErrorBox("出错了", "签名文件密码不能为空");
        } else if (!this.keystoreAlias) {
          dialog.showErrorBox("出错了", "别名不能为空");
        } else if (!this.keyPass) {
          dialog.showErrorBox("出错了", "别名密码不能为空");
        }
      }
    }
  },
  watch: {
    outputPathSelctor(value) {
      this.outputPathInputDisabled = value == 0;
      if (value == 0) {
        this.outputPath = global_.defaultOutputPath;
      } else {
        if (global_.outputPath !== global_.defaultOutputPath) {
          this.outputPath = global_.outputPath;
        } else {
          this.outputPath = "";
        }
      }
    },
    keyStoreSelctor(value) {
      this.keystoreInputDisabled = value == 0;
      console.log(global_.defaultKeystorePath+"__________");
      if (value == 0) {
        if(global_.defaultKeystorePath){
          this.keystorePath = global_.defaultKeystorePath;
          this.storePass = global_.defaultKeystorePass;
          this.keystoreAlias = global_.defaultKeyAlias;
          this.keyPass = global_.defaultKeyAliasPass;
        }else{
          if(this.toolsPath){
              let tmpKeystorePath=path.join(this.toolsPath, "android", "default", "uwan.jks");
              if(fs.existsSync(tmpKeystorePath)){
                this.keystorePath=tmpKeystorePath;
                this.storePass='5221350';
                this.keystoreAlias='key0';
                this.keyPass='5221350';
              }
          }
        }
      } else if(value == 1){
        if (global_.keystorePath !== global_.defaultKeystorePath) {
          this.storePass = global_.keystorePass;
          this.keystoreAlias = global_.keyAlias;
          this.keyPass = global_.keyAliasPass;
          this.keystorePath = global_.keystorePath;
        } else {
          this.storePass = "";
          this.keystoreAlias = "";
          this.keyPass = "";
          this.keystorePath = "";
        }
      }
    }
  }
};
</script>
<style>
#settings {
  margin: 5px;
}
.vDiv {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.hDiv {
  width: 100%;
  display: flex;
  margin: 10px 0px 0px 20px;
}
.hDiv div {
  align-items: center;
  margin: 0px 0px 0px 20px;
}
.hDiv2 {
  display: inline-flex;
  margin: 0px 0px 0px 0px;
  align-items: center;
}
.hDiv2 input {
  width: 500px;
  margin: 0px 20px 0px 0px;
}
.hDiv2 button {
  margin: 0px 20px 0px 0px;
}
.hDiv3 {
  display: inline-flex;
  margin: 10px 0px 0px 16px;
  align-items: center;
}
.hDiv3 label {
  width: 167px;
  margin: 0px 0px 0px 3px;
}
.hDiv3 input {
  width: 156px;
  margin: 0px 15px 0px 0px;
}
.saveBtn {
  width: 200px;
  margin: 40px 0px 0px 17px;
}

.line2 {
  margin: 5px 5px 0px 0px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.2) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset;
  width: 100%;
  height: 2px;
}
</style>