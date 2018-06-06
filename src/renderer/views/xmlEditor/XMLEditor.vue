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
.div1{
  margin: 20px 0px 0px 5px;
  width: 100%;
}
.hDiv2 {
  margin: 0px 0px 10px 0px;
}
.hDiv2 label{
  color: blue;
  width: 200px;
  height: 20px;
  text-align: left;
}
.hDiv2 input{
  width: 100%;
}
.saveBtn {
  width: 200px;
  margin: 20px 0px 0px 17px;
}
.saveBtn:focus,.saveBtn:active:focus,.saveBtn.active:focus,.saveBtn.focus,.saveBtn:active.focus,.saveBtn.active.focus{    
  outline: none;    
  border-color: transparent;    
  box-shadow:none;
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
var nodeIdStart = 0;
export default {
  data() {
    return {
      ztreeDataSource: [],
      ztreeRawDatas: null,
      dataList: [],
      parentNodeModel: [], //当前点击节点父亲对象
      curNodeModel: null, // 当前点击节点对象
      curNodeProps:[],
    };
  },
  components: {
    vueZtree
  },
  mounted() {
    const xml2js = require("xml2js");
    let parser = new xml2js.Parser();
    let rootNode = [{ name: "manifest", children: [] }];
    parser.parseString(xmlStr, (err, result) => {
      console.log(result);
      let rootNode2 = {};
      this.deepCloneAndTranslate2(rootNode2, result);
      console.log(rootNode2);
      // this.ztreeRawDatas = rootNode2;
      // let rootNode3 = { name: "", children: [], id: 0, parentId: 0 };
      // this.createTreeData(rootNode3, rootNode2);
      // this.ztreeDataSource = rootNode3.children;
    });
    
  },
  methods: {
    findSourceNodeById2(data, nodeId){
      var vm = this;
      var result;
      for (let i = 0; i < data.length; i++) {
        if (nodeId == data[i].id) {
          result=data[i];
          break;
        }else{ 
          if (data[i].hasOwnProperty("children")) {
            result=vm.findSourceNodeById2(data[i].children, nodeId);
            if(result){
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
      let arr=[];
      for(let propName in this.curNodeModel){
        if(propName.indexOf("@android")>=0||propName.indexOf("@package")>=0){
          arr.push({propName:propName.substr(1),propValue:this.curNodeModel[propName]});
        }
      }
      this.curNodeProps=arr;
    },
    nodeDelete(m,indx){
      let sourceNode=this.findSourceNodeById2(this.ztreeDataSource,m.id);
      if(sourceNode.rawData.vParent instanceof Array){
        let index=indx;
        if(index>=0){
          console.log("=====:"+index);
          console.log(sourceNode.rawData.vParent);
          sourceNode.rawData.vParent.splice(index,1);
          if(sourceNode.rawData.vParent.length==0&&sourceNode.rawData.vPParent){
            delete sourceNode.rawData.vPParent[sourceNode.rawData.key];
          }
        }else{
          console.error("==============节点错误0================");
          console.log(sourceNode.rawData.value);
          console.log(sourceNode.rawData.vParent);
          console.error("=====================================");
        }
      }else{
        console.log(sourceNode.rawData.key);
        console.log(sourceNode.rawData.vParent);
        console.log(sourceNode.rawData.vPParent);
        if(sourceNode.rawData.vParent.hasOwnProperty(sourceNode.rawData.key)){
          delete sourceNode.rawData.vParent[sourceNode.rawData.key];
        }else{
          console.error("==============节点错误1================");
          console.log(sourceNode);
          console.error("=====================================");
        }
      }
    },
    savePropValuesHandler() {
      let sourceNode=this.findSourceNodeById2(this.ztreeDataSource,this.curNodeModel.id);
      console.log(sourceNode);
      for(let obj of this.curNodeProps){
        console.log(obj.propName);
        console.log(obj.propValue);
        this.curNodeModel[`@${obj.propName}`]=obj.propValue;
        this.curNodeModel.rawData.value[`@${obj.propName}`]=obj.propValue;

        sourceNode[`@${obj.propName}`]=obj.propValue;
        sourceNode.rawData.value[`@${obj.propName}`]=obj.propValue;

        if(this.curNodeModel.name!==this.curNodeModel.rawData.key){
          if (this.curNodeModel["@android:name"]) {
            this.curNodeModel.name = `${this.curNodeModel.rawData.key}(${this.curNodeModel["@android:name"]})`;
          } else if (this.curNodeModel["@android:scheme"]) {
            this.curNodeModel.name = `${this.curNodeModel.rawData.key}(scheme:${this.curNodeModel["@android:scheme"]})`;
          } 
        }
      }
    },
    outHandler(){
      const xmlbuilder = require("xmlbuilder")
      let feed = xmlbuilder.create(this.ztreeRawDatas, { encoding: 'utf-8' });
      console.log(feed.end({ pretty: true }));

    },
    deepCloneAndTranslate2(root, obj) {
      if (!(obj instanceof Array)) {
        if (obj instanceof Object) {
          let node;
          if (root instanceof Array) {
            node = {};
            root.push(node);
          } else {
            node = root;
          }
          for (let key in obj) {
            if (key != "$" && key != "_") {
              let value = obj[key];
              if (value instanceof Array) {
                node[key] = [];
                this.deepCloneAndTranslate2(node[key], value);
              } else if (value instanceof Object) {
                node[key] = {};
                this.deepCloneAndTranslate2(node[key], value);
              } else {
                root[key] = value;
              }
            } else if (key === "$") {
              let rawAtts = obj[key];
              for (let attKey in rawAtts) {
                node["@" + attKey] = rawAtts[attKey];
              }
            } else if (key === "_") {
              let value = obj[key];
              node["#text"] = value;
            }
          }
        } else {
          if (root instanceof Array) {
            root.push(obj);
          }
        }
      } else {
        for (let elem of obj) {
          this.deepCloneAndTranslate2(root, elem);
        }
      }
    },
    createTreeData(node, nodeData) {
      for (let key in nodeData) {
        let value = nodeData[key];
        if (key[0] === "@") {
          //copy 属性
          node[key] = value;
        } else {
          if (value instanceof Array && value.length > 1) {
            let childNode = {
              name: key,
              children: [],
              pNode: null,
              ckbool: true
            };
            node.children.push(childNode);
            nodeIdStart++;
            childNode.id = nodeIdStart;
            childNode.parentId = node.id;
            childNode.rawData = { key: key, value: value,vParent:nodeData};

            for (let ccData of value) {
              let ccName = "";
              if (ccData["@android:name"]) {
                ccName = `${key}(${ccData["@android:name"]})`;
              } else if (ccData["@android:scheme"]) {
                ccName = `${key}(scheme:${ccData["@android:scheme"]})`;
              }else{
                ccName=key;
              }

              let childchildNode = {
                name: ccName,
                children: [],
                pNode: null,
                ckbool: true
              };
              childNode.children.push(childchildNode);
              nodeIdStart++;
              childchildNode.id = nodeIdStart;
              childchildNode.parentId = childNode.id;
              childchildNode.rawData = { key: key, value: ccData,vParent:value,vPParent:nodeData };
              this.createTreeData(childchildNode, ccData);
            }
          } else {
            let cData;
            let cName;
            let vParent;
            if (value instanceof Array) {
              cData = value[0];
              vParent=nodeData;//value;
            } else {
              cData = value;
              cName = key;
              vParent=nodeData;
            }
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
            childNode.rawData = { key: key, value: cData,vParent:vParent};
            this.createTreeData(childNode, cData);
          }
        }
      }
    },
  },
};
let xmlStr = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
      package="com.ourpalm.zhj.zq"
      android:versionCode="167"
      android:versionName="1.6.7"
      android:installLocation="auto">

    <uses-sdk android:minSdkVersion="13" android:targetSdkVersion="18"/>
    <uses-feature android:glEsVersion="0x00020000" />
    
    <supports-screens android:largeScreens="true"
                      android:smallScreens="true"
                      android:anyDensity="true"
                      android:normalScreens="true"/>
    
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"></uses-permission>
    <uses-permission android:name="android.permission.INTERNET"></uses-permission>
    <uses-permission android:name="android.permission.READ_PHONE_STATE"></uses-permission>
    <uses-permission android:name="android.permission.READ_LOGS"></uses-permission>
    <uses-permission android:name="android.permission.WAKE_LOCK"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/>
    <uses-permission android:name="android.permission.CHANGE_CONFIGURATION"/>
    <uses-permission android:name="com.android.vending.BILLING"/>
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.MOUNT_UNMOUNT_FILESYSTEMS" />
    
    
    <!-- Google服务 -->
    <uses-permission android:name="android.permission.GET_ACCOUNTS" />
    
    <!-- Push service 运行需要的权限 -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WRITE_SETTINGS" />
    <uses-permission android:name="android.permission.ACCESS_DOWNLOAD_MANAGER" />
    <uses-permission android:name="android.permission.DOWNLOAD_WITHOUT_NOTIFICATION" />
    <uses-permission android:name="android.permission.DISABLE_KEYGUARD" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.EXPAND_STATUS_BAR" />
    <uses-permission android:name="android.permission.GET_TASKS" />
    
    <!-- for log. -->
    <uses-permission android:name="android.permission.ACCESS_DOWNLOAD_MANAGER"/>
    <uses-permission android:name="android.permission.DOWNLOAD_WITHOUT_NOTIFICATION" />    
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
    <uses-permission android:name="android.permission.DISABLE_KEYGUARD" />    
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    
	<!-- 登录上报时需要带设备名称, 通过蓝牙模块来获取设备名称 -->
	<uses-permission android:name="android.permission.BLUETOOTH" />
	<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
	<!-- TODO SDK接入 必须权限模块 END -->
	
	<!-- 禁止锁屏 -->
	<uses-permission android:name="android.permission.WAKE_LOCK" />
	   
    <application
        android:name="ourpalm.android.channels.Info.Ourpalm_Channels_Application"
        android:allowBackup="true"
        android:persistent="true"
        android:icon="@drawable/zhj_icon"
        android:label="@string/app_name"
        android:theme="@style/AppTheme"
        android:debuggable="false">
        <activity
            android:name="com.ourpalm.zhj.zq.SplashActivity"
            android:configChanges="locale|fontScale|keyboard|keyboardHidden|mcc|mnc|navigation|orientation|screenLayout|screenSize|smallestScreenSize|touchscreen|uiMode"
            android:label="@string/app_name"
            android:screenOrientation="sensorLandscape"
            android:theme="@android:style/Theme.NoTitleBar.Fullscreen" >
        </activity>
        <activity
            android:name="com.ourpalm.zhj.zq.Main"
            android:label="@string/app_name"
            android:screenOrientation="sensorLandscape" 
            android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
            android:launchMode="standard"
            android:configChanges="orientation|keyboardHidden|navigation|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <data android:scheme="qwalletcom.uwan.wdpt.vivo"/>
            </intent-filter>
        </activity>
        <!-- 客服反馈功能的Activity V3.1.7新增加 --> 
        <activity  
          android:name="ourpalm.android.opservice.Ourpalm_OpService_Activity"  
          android:configChanges="keyboardHidden|orientation|screenSize"  
          android:theme="@android:style/Theme.Translucent.NoTitleBar" >  
       </activity>
        <!-- 游戏自己的启动activity类名，需要完整路径，必须配置 -->
        <meta-data
            android:name="ourpalm_class_name"
            android:value="com.ourpalm.zhj.zq.Main" />
        <!-- 游戏请配置自己游戏的展示类型，竖屏游戏请配置成 portrait，横屏游戏请配置成landscape -->
        <meta-data
            android:name="ourpalm_screenOrientation"
            android:value="landscape" />
        <meta-data
            android:name="ourpalm_gametype_console"
            android:value="false" />
        
       <service 
            android:name="com.ourpalm.zhj.zq.SendNotifyService"
            android:persistent="true"
			android:process="system" >
       	</service>
			
		<!-- push应用定义消息receiver声明 -->
        <receiver android:name="com.ourpalm.zhj.zq.MyPushMessageReceiver" >
            <intent-filter>
                <!-- 接收push消息 -->
                <action android:name="com.baidu.android.pushservice.action.MESSAGE" />
                <!-- 接收bind,unbind,fetch,delete等反馈消息 -->
                <action android:name="com.baidu.android.pushservice.action.RECEIVE" />
                <action android:name="com.baidu.android.pushservice.action.notification.CLICK" />
            </intent-filter>
        </receiver>

        <!-- push必须的receviver和service声明 -->
        <receiver
            android:name="com.baidu.android.pushservice.PushServiceReceiver"
            android:process=":bdservice_v1" >
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.net.conn.CONNECTIVITY_CHANGE" />
                <action android:name="com.baidu.android.pushservice.action.notification.SHOW" />
                <action android:name="com.baidu.android.pushservice.action.media.CLICK" />
                <!-- 以下四项为可选的action声明，可大大提高service存活率和消息到达速度 -->
                <action android:name="android.intent.action.MEDIA_MOUNTED" />
                <action android:name="android.intent.action.USER_PRESENT" />
                <action android:name="android.intent.action.ACTION_POWER_CONNECTED" />
                <action android:name="android.intent.action.ACTION_POWER_DISCONNECTED" />
            </intent-filter>
        </receiver>
        <receiver
            android:name="com.baidu.android.pushservice.RegistrationReceiver"
            android:process=":bdservice_v1" >
            <intent-filter>
                <action android:name="com.baidu.android.pushservice.action.METHOD" />
                <action android:name="com.baidu.android.pushservice.action.BIND_SYNC" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.PACKAGE_REMOVED" />
        		<data android:scheme="package" />
            </intent-filter>
        </receiver>

        <service
            android:name="com.baidu.android.pushservice.PushService"
            android:exported="true"
            android:process=":bdservice_v1" >
            <intent-filter>
                <action android:name="com.baidu.android.pushservice.action.PUSH_SERVICE" />
            </intent-filter>
        </service>
        <service
            android:name="com.baidu.android.pushservice.CommandService"
            android:exported="true" />

        <!-- 4.6.2版本增加一个可选的Activity声明 -->
        <activity
            android:launchMode="singleInstance"
            android:name="com.baidu.android.pushservice.PushKeepAlive"
            android:theme="@android:style/Theme.Translucent.NoTitleBar" />

        <!-- 在百度开发者中心查询应用的API Key -->
        <meta-data
            android:name="api_key"
            android:value="o4eNoAVFsScFaOkZsgmISedu" />
            
            
			<!-- 闪屏配置 
        <activity android:name="ourpalm.android.logo.Ourpalm_LogoScreen_Activity" 
		    android:configChanges="orientation|keyboardHidden|screenSize|screenLayout"
			android:theme="@android:style/Theme.NoTitleBar"  
			android:screenOrientation="landscape" >
			<intent-filter>
				<action android:name="android.intent.action.MAIN" />
                <data android:scheme="qwalletcom.uwan.wdpt.vivo"/>
				
				<category android:name="android.intent.category.LAUNCHER" />
			</intent-filter>
        </activity>-->
		<!-- 闪屏默认配置 -->
        <meta-data
            android:name="ourplam_logo_flag"
            android:value="1" />
		
		<!-- 闪屏时间为 2S -->
        <meta-data
            android:name="ourplam_logotime"
            android:value="2000" />    
         <!-- BASE SDK中上传崩溃日志的服务 V3.2.1版本新增加 -->
        <service
            android:name="ourpalm.android.c.Ourpalm_CrashService"
            android:process=":ourpalmCrash" >
            <intent-filter>
                <action android:name="ourpalm.UpCrashLog" />
            </intent-filter>
        </service>
        <service
            android:name="ourpalm.android.PushServer.Ourpalm_PushServer"
            android:enabled="true"
            android:exported="false"
            android:label="PushService"
            android:persistent="true"
            android:process=":ourpalmPushservice" >
            <intent-filter>
                <action android:name="Ourpalm_PushServer" />

                <category android:name="android.intent.category.default" />
            </intent-filter>
        </service>    
          <!-- 广播注册 -->
        <receiver android:name="ourpalm.android.PushServer.Ourpalm_Alarm_BroadcastReceiver" >
            <intent-filter android:priority="1000" >
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.net.conn.CONNECTIVITY_CHANGE" />
                <action android:name="ourpalm.pushserver.notice.ourpalm_package_name" />
            </intent-filter>
        </receiver>

        <!-- <android:authorities="ourpalm_package_name.AUTH_PUSHID" /> -->
        <provider
            android:name="ourpalm.android.push.Ourpalm_PushId_Provider"
            android:authorities="ourpalm_package_name.AUTH_PUSHID"
            android:exported="true" />
           
    </application>
	
</manifest> 
`;
</script>
