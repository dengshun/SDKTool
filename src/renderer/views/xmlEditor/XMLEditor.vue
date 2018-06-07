<style>
html {
  overflow-x: hidden;
  overflow-y: hidden;
}
.topBox {
  display: flex;
  flex-wrap: nowrap;
}
.box1 {
  width: 100%;
  height: 100vh;
  overflow: auto;
}
.div1 {
  margin: 20px 0px 0px 5px;
  width: 100%;
}
.hDiv2 {
  margin: 0px 0px 10px 0px;
}
.hDiv2 label {
  color: blue;
  width: 200px;
  height: 20px;
  text-align: left;
}
.hDiv2 input {
  width: 100%;
}
.saveBtn {
  width: 200px;
  margin: 20px 0px 0px 17px;
}
.saveBtn:focus,
.saveBtn:active:focus,
.saveBtn.active:focus,
.saveBtn.focus,
.saveBtn:active.focus,
.saveBtn.active.focus {
  outline: none;
  border-color: transparent;
  box-shadow: none;
}
</style>
<template>
  <div class="topBox">
      <div class="box1">
        <vue-ztree :list.sync='ztreeDataSource' :func='nodeClick' :delFunc='nodeDelete' :is-open='true' :is-check='false'></vue-ztree>
      </div>
      <div class="div1" v-if="curNodeProps.length>0">
        <div class="col-sm-12 hDiv2" v-for="(obj) in curNodeProps" v-bind:key="obj.id">
            <label>{{obj.propName}}：</label>
            <input type="text" class="form-control input-sm"  v-model="obj.propValue">
        </div>
        <button class="btn btn-sm btn-danger saveBtn" v-on:click="savePropValuesHandler">保存</button>
        <button class="btn btn-sm btn-danger saveBtn" v-on:click="outHandler">导出XML</button>
      </div>
  </div>
</template>

<script>
import vueZtree from "../comps/vue-ztree.vue";
const { remote, ipcRenderer } = require('electron')
const xml2js = require("xml2js");
var nodeIdStart = 0;
export default {
  data() {
    return {
      ztreeDataSource: [],
      ztreeRawDatas: null,
      parentNodeModel: [], //当前点击节点父亲对象
      curNodeModel: null, // 当前点击节点对象
      curNodeProps: [],
      winId: 0,
      mainWinId:0,
      isDirty:false,
    };
  },
  components: {
    vueZtree
  },
  mounted() {
    let self=this;
    // let parser = new xml2js.Parser();
    // let rootNode = [{ name: "manifest", children: [] }];
    // parser.parseString(xmlStr, (err, result) => {
    //   console.log(result);
    //   let rootNode2 = {};
    //   this.deepCloneAndTranslate2(rootNode2, result);
    //   console.log(rootNode2);
    //   this.ztreeRawDatas = rootNode2;
    //   let rootNode3 = { name: "", children: [], id: -1, parentId: -1 };
    //   this.createTreeData(rootNode3, rootNode2);
    //   this.ztreeDataSource = rootNode3.children;
    // });
    ipcRenderer.on("update_data", (event, data) => {
      this.winId = data.winId;
      this.mainWinId=data.mainWinId;
      console.log(data.data);
      console.log("--------------sdfsdfdfdfsdf::" + this.winId,"||"+this.mainWinId);
      let rootNode2 = JSON.parse(data.data);
      this.ztreeRawDatas = rootNode2;
      let rootNode3 = { name: "", children: [], id: -1, parentId: -1 };
      this.createTreeData(rootNode3, rootNode2);
      this.ztreeDataSource = rootNode3.children;
      this.isDirty=false;
    });
    window.onbeforeunload = function(e) {
      if(self.isDirty){
        let buttons = ["保存", "取消"];
        remote.dialog.showMessageBox(
          {
            type: "question",
            title: "提示",
            buttons: buttons,
            message: "Manifest.xml已修改，是否保存？"
          },
          index => {
            if (index === 0) {
                remote.BrowserWindow.fromId(self.mainWinId).webContents.send('save_manifest', self.outputXML());
            } else {
            }
          }
        );
      }
    };
  },
  methods: {
    findSourceNodeById2(data, nodeId) {
      var vm = this;
      var result;
      for (let i = 0; i < data.length; i++) {
        if (nodeId == data[i].id) {
          result = data[i];
          break;
        } else {
          if (data[i].hasOwnProperty("children")) {
            result = vm.findSourceNodeById2(data[i].children, nodeId);
            if (result) {
              break;
            }
          }
        }
      }
      return result;
    },
    // 点击节点
    nodeClick(m, parent, trees) {
      this.curNodeModel = m; // 当前点击节点对象
      this.parentNodeModel = parent; //当前点击节点父亲对象

      console.log("currentNode=========:");
      console.log(m.rawData);
      console.log(parent.rawData);
      console.log("currentNode========end");
      let arr = [];
      for (let propName in this.curNodeModel) {
        if (
          propName.indexOf("@android") >= 0 ||
          propName.indexOf("@package") >= 0
        ) {
          arr.push({
            propName: propName.substr(1),
            propValue: this.curNodeModel[propName]
          });
        }
      }
      this.curNodeProps = arr;
    },
    nodeDelete(m) {
      this.isDirty=true;
      if(m==this.curNodeModel){
        this.curNodeModel=null;
        this.parentNodeModel=null;
        this.curNodeProps.splice(0,this.curNodeProps.length);
      }
      let sourceNode = this.findSourceNodeById2(this.ztreeDataSource, m.id);
      if (sourceNode.rawData.vParent instanceof Array) {
        let idx = -1;
        for (let i = 0; i < sourceNode.rawData.vParent.length; i++) {
          if (m.id == sourceNode.rawData.vParent[i]["__id__"]) {
            idx = i;
            break;
          }
        }
        if (idx >= 0) {
          sourceNode.rawData.vParent.splice(idx, 1);
          if (
            sourceNode.rawData.vParent.length == 0 &&
            sourceNode.rawData.vPParent
          ) {
            delete sourceNode.rawData.vPParent[sourceNode.rawData.key];
          }
        } else {
          console.error("==============节点错误0================");
          console.log(sourceNode.rawData.value);
          console.log(sourceNode.rawData.vParent);
          console.error("=====================================");
        }
      } else {
        if (sourceNode.rawData.vParent.hasOwnProperty(sourceNode.rawData.key)) {
          delete sourceNode.rawData.vParent[sourceNode.rawData.key];
        } else {
          console.error("==============节点错误1================");
          console.log(sourceNode);
          console.error("=====================================");
        }
      }
    },
    savePropValuesHandler() {
      let sourceNode = this.findSourceNodeById2(
        this.ztreeDataSource,
        this.curNodeModel.id
      );
      console.log(sourceNode);
      for (let obj of this.curNodeProps) {
        console.log(obj.propName);
        console.log(obj.propValue);
        if(this.curNodeModel[`@${obj.propName}`]!==obj.propValue){
          this.curNodeModel[`@${obj.propName}`] = obj.propValue;
          this.isDirty=true;
        }
        this.curNodeModel.rawData.value[`@${obj.propName}`] = obj.propValue;

        sourceNode[`@${obj.propName}`] = obj.propValue;
        sourceNode.rawData.value[`@${obj.propName}`] = obj.propValue;

        if (this.curNodeModel.name !== this.curNodeModel.rawData.key) {
          if (this.curNodeModel["@android:name"]) {
            this.curNodeModel.name = `${this.curNodeModel.rawData.key}(${
              this.curNodeModel["@android:name"]
            })`;
          } else if (this.curNodeModel["@android:scheme"]) {
            this.curNodeModel.name = `${this.curNodeModel.rawData.key}(scheme:${
              this.curNodeModel["@android:scheme"]
            })`;
          }
        }
      }
    },
    outHandler() {
      console.log(this.ztreeRawDatas);
      console.log(this.outputXML());
    },
    outputXML(){
      const xmlbuilder = require("xmlbuilder");
      let feed = xmlbuilder.create(this.ztreeRawDatas, { encoding: "utf-8" });
      return feed.end({ pretty: true });
    },
    // deepCloneAndTranslate2(root, obj) {
    //   if (!(obj instanceof Array)) {
    //     if (obj instanceof Object) {
    //       let node;
    //       if (root instanceof Array) {
    //         node = {};
    //         root.push(node);
    //       } else {
    //         node = root;
    //       }
    //       for (let key in obj) {
    //         if (key != "$" && key != "_") {
    //           let value = obj[key];
    //           if (value instanceof Array) {
    //             node[key] = [];
    //             this.deepCloneAndTranslate2(node[key], value);
    //           } else if (value instanceof Object) {
    //             node[key] = {};
    //             this.deepCloneAndTranslate2(node[key], value);
    //           } else {
    //             root[key] = value;
    //           }
    //         } else if (key === "$") {
    //           let rawAtts = obj[key];
    //           for (let attKey in rawAtts) {
    //             node["@" + attKey] = rawAtts[attKey];
    //           }
    //         } else if (key === "_") {
    //           let value = obj[key];
    //           node["#text"] = value;
    //         }
    //       }
    //     } else {
    //       if (root instanceof Array) {
    //         root.push(obj);
    //       }
    //     }
    //   } else {
    //     for (let elem of obj) {
    //       this.deepCloneAndTranslate2(root, elem);
    //     }
    //   }
    // },
    createTreeData(node, nodeData) {
      for (let key in nodeData) {
        let value = nodeData[key];
        if (key[0] === "@") {
          //copy 属性
          node[key] = value;
        } else {
          if (value instanceof Array) {
            for (let ccData of value) {
              let ccName = "";
              if (ccData["@android:name"]) {
                ccName = `${key}(${ccData["@android:name"]})`;
              } else if (ccData["@android:scheme"]) {
                ccName = `${key}(scheme:${ccData["@android:scheme"]})`;
              } else {
                ccName = key;
              }

              let childchildNode = {
                name: ccName,
                children: [],
                pNode: null,
                ckbool: true
              };
              node.children.push(childchildNode);
              nodeIdStart++;
              childchildNode.id = nodeIdStart;
              childchildNode.parentId = node.id;
              Object.defineProperty(ccData, "__id__", {
                value: childchildNode.id,
                enumerable: false
              });
              childchildNode.rawData = {
                key: key,
                value: ccData,
                vParent: value,
                vPParent: nodeData
              };
              this.createTreeData(childchildNode, ccData);
            }
          } else {
            let cData = value;
            let cName = key;
            let vParent = nodeData;

            if (cData["@android:name"]) {
              cName = `${key}(${cData["@android:name"]})`;
            } else if (cData["@android:scheme"]) {
              cName = `${key}(scheme:${cData["@android:scheme"]})`;
            } else {
              cName = key;
            }

            let childNode = {
              name: cName,
              children: [],
              pNode: null,
              ckbool: true
            };
            node.children.push(childNode);
            nodeIdStart++;
            childNode.id = nodeIdStart;
            childNode.parentId = node.id;
            Object.defineProperty(cData, "__id__", {
              value: childNode.id,
              enumerable: false
            });
            childNode.rawData = { key: key, value: cData, vParent: vParent };
            this.createTreeData(childNode, cData);
          }
        }
      }
    }
  }
};
</script>
