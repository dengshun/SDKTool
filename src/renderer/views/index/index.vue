<template>
    <div id="wrapper">
        <link id="theme" rel="stylesheet" href="static/dark.css">
        <div class="col" id="mainView">
            <ul class="nav nav-tabs" role="tablist" id="tabs" v-bind:class="{'tabs-background':tabs.length > 0}">
              <li v-for="tab in tabs" class="nav-item" v-bind:key="tab.id">
                <a class="nav-link" role="tab" :href="'#tab' + tab.id" :id="tab.id" data-toggle="tab">
                  <table class="navtable">
                    <tr>
                      <td class="tabname">
                        <span>
                          {{ tab.name }}
                        </span>
                      </td>
                    </tr>
                  </table>
                </a>
              </li>
            </ul>
            <!-- Tab panes -->
            <div class="tab-content">
              <div v-for="tab in tabs" v-bind:key="tab.id" role="tabpanel" class="tab-pane fade" :id="'tab' + tab.id">
                <opView v-if="tab.type === 'opView'" ></opView>
                <settingView v-if="tab.type === 'settingsView'" ></settingView>
              </div>
            </div>
        </div>
    </div>
</template>
<script>
import OPView from "./tabs/OPView.vue";
import settingView from "./tabs/settingView.vue";
import { execCMD } from "../../common/cmd";
import global_ from "../../Global";
const path = require("path")
const {  dialog,app } = require("electron").remote
const os = require("os");
export default {
  data: function() {
    return {
      tabs: []
    };
  },
  mounted: async function() {
    global_.workBasePath = path.join(app.getPath("userData"), "apkToolTmp");
    global_.defaultOutputPath = path.join(global_.workBasePath, "new", "apk");
    global_.outputPath = global_.defaultOutputPath;
    console.log(global_.workBasePath);
    this.$db.preferences.findOne({ type:"setting" },  (err, result)=> {
      console.log(err,"===========-=-=-=-=-=-=-",result);
      if(result){
          if(result.data.outputPath){
            global_.outputPath = result.data.outputPath;
          }
          if(result.data.keystorePath){
            global_.keystorePath=result.data.keystorePath;
            global_.keystorePass=result.data.keystorePass;
            global_.keyAlias=result.data.keyAlias;
            global_.keyAliasPass=result.data.keyAliasPass;
          }
          global_.toolsPath=result.data.toolsPath||"";
        }else{
          global_.toolsPath=""
        }
        if(global_.toolsPath!=""&&global_.toolsPath!=null){
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

           if(!global_.keystorePath){
              global_.keystorePath=global_.defaultKeystorePath;
              global_.keystorePass=global_.defaultKeystorePass;
              global_.keyAlias=global_.defaultKeyAlias;
              global_.keyAliasPass=global_.defaultKeyAliasPass;
           }
        }
    });

    this.tabs.push({ id: 1, name: "打包", tab: 0, type: "opView" });
    this.tabs.push({ id: 2, name: "设置", tab: 1, type: "settingsView" });
    setTimeout(() => {
      console.log(global_.toolsPath);
      if(!global_.toolsPath){
        $(".nav-tabs li:eq(1) a").tab("show");
      }else{
        $(".nav-tabs li:eq(0) a").tab("show");
      }
      $('#tabs a').click(function (e) {
        if(e.currentTarget.id==1){
          if(!global_.toolsPath){
            dialog.showErrorBox("出错了", "请设置依赖工具路径");
            e.stopPropagation()
          }
        }
        })
    }, 1000);

  },
  components: {
    opView: OPView,
    settingView: settingView
  },
};
</script>
<style>
body {
  font-family: "Montserrat", sans-serif;
  font-size: 14px;
  font-weight: 300;
}
html,
body,
#app {
  height: 100%;
  display: flex;
}
#wrapper {
  width: 100vw;
  height: 100vh;
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.fa {
  cursor: pointer;
}
.btn:focus,
.btn:active:focus,
.btn.active:focus,
.btn.focus,
.btn:active.focus,
.btn.active.focus {
  outline: none !important;
  box-shadow: none !important;
}

#mainView {
  padding-left: 0px;
  margin-right: 0;
  margin-left: 0;
}

#mainView #tabs {
  position: fixed;
  top: 0;
  overflow-x: auto;
  width: 100vw;
  border: none;
  height: 40px;
  border-bottom: none !important;
  overflow-y: hidden;
}

#mainView .tabs-background {
}

li {
  display: inline;
}

.tab-content {
  margin: 45px 5px 5px 5px !important;
}

.nav-tabs > li > a {
  height: 40px;
  border: none !important;
}

.navtable {
  min-width: 150px;
  width: 150px;
  table-layout: fixed;
}

.navtable .tabname {
  width: 100px;
  text-align: center;
  overflow-x: auto;
}

.navtable .tabname span {
  white-space: nowrap;
}

.nav-tabs > li > a:hover {
  border: none;
}
.nav-tabs > li > a:hover i {
  border: none;
}

.nav-tabs > li > a.active {
  text-decoration: none;
}
</style>