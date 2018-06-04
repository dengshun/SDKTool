<style>
html {
  overflow-x:hidden;
  overflow-y:hidden;
}
.topBox{
    display: flex;
    flex-wrap: nowrap;
}
.box1{
  width: 70%;
  height: 100vh;
  overflow:auto;
}
</style>
<template>
  <div class="topBox">
      <div class="box1">
        <vue-ztree :list.sync='ztreeDataSource' :func='nodeClick' :is-open='true' :is-check='true'></vue-ztree>
      </div>
      <div>
        sdfsdfsdfsdfsdf
      </div>
  </div>
</template>

<script>
import vueZtree from "../comps/vue-ztree.vue";
var $ = require("jquery");
var nodeIdStart = 0;
export default {
  data() {
    return {
      msg: "Hello Vue-Ztree-2.0!",
      ztreeDataSource: [],
      ztreeRawDatas:null,
      dataList: [],
      treeDeepCopy: [],
      parentNodeModel: [], //当前点击节点父亲对象
      nodeModel: null // 当前点击节点对象
    };
  },
  methods: {
    findById: function(data, parentId) {
      var vm = this;

      for (var i = 0; i < data.length; i++) {
        if (parentId == data[i].id) {
          console.log(data[i]);

          vm.dataList.push(data[i]);

          vm.findById(vm.ztreeDataSource, data[i].parentId);

          return data[i];
        }

        if (data[i].hasOwnProperty("children")) {
          vm.findById(data[i].children, parentId);
        }
      }
    },
    // 点击节点
    nodeClick: function(m, parent, trees) {
      this.treeDeepCopy = trees;
      this.nodeModel = m; // 当前点击节点对象
      this.parentNodeModel = parent; //当前点击节点父亲对象

      console.log("currentNode=========:");
      console.log(m.rawData);
      console.log(parent.rawData);
      console.log("currentNode========end");

      // 导航菜单
      this.dataList = [];
      this.findById(this.ztreeDataSource, m.parentId);
      this.dataList = this.dataList.reverse();
      this.dataList.push(m);
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
    deepCloneAndTranslate: function(root, obj, key) {
      if (!(obj instanceof Array)) {
        if (obj instanceof Object) {
          let node = root;
          for (let key in obj) {
            if (key != "$" && key != "_") {
              let value = obj[key];
              if (value instanceof Array) {
                let childNode;
                if (value.length > 1) {
                  childNode = { name: key, children: [] };
                  root.children.push(childNode);
                } else {
                  childNode = root;
                }
                this.deepCloneAndTranslate(childNode, value, key);
              } else if (value instanceof Object) {
                this.deepCloneAndTranslate(node, value);
              } else {
                root[key] = value;
              }
            } else if (key === "$") {
              let rawAtts = obj[key];
              for (let attKey in rawAtts) {
                node["@" + attKey] = rawAtts[attKey];
              }
              if (node["@android:name"]) {
                node["name"] = `${node["name"]}(${node["@android:name"]})`;
              } else if (node["@android:scheme"]) {
                node["name"] = `${node["name"]}(scheme:${
                  node["@android:scheme"]
                })`;
              }
            } else if (key === "_") {
              let value = obj[key];
              node["#text"] = value;
            }
          }
        } else {
        }
      } else {
        for (let elem of obj) {
          let childNode;
          if (root.children) {
            childNode = { children: [], name: key };
            root.children.push(childNode);
          } else {
            childNode = root;
          }
          this.deepCloneAndTranslate(childNode, elem);
        }
      }
    },
    createTreeData(node, nodeData) {
      for (let key in nodeData) {
        let value = nodeData[key];
        if (key[0] === "@") {//copy 属性
          node[key] = value;
        } else {
          if (value instanceof Array && value.length > 1) {
            let childNode = { name: key, children: [], pNode: null ,ckbool:true};
            node.children.push(childNode);
            nodeIdStart++;
            childNode.id = nodeIdStart;
            childNode.parentId = node.id;
            childNode.rawData={key:key,value:value};

            for (let ccData of value) {
              let ccName = "";
              if (ccData["@android:name"]) {
                ccName = `${key}(${ccData["@android:name"]})`;
              } else if (ccData["@android:scheme"]) {
                ccName = `${key}(scheme:${ccData["@android:scheme"]})`;
              }

              let childchildNode = { name: ccName, children: [], pNode: null,ckbool:true };
              childNode.children.push(childchildNode);
              nodeIdStart++;
              childchildNode.id = nodeIdStart;
              childchildNode.parentId = childNode.id;
              childchildNode.rawData={key:key,value:ccData};
              this.createTreeData(childchildNode, ccData);
            }
          } else {
            let cData;
            let cName;
            if (value instanceof Array) {
              cData = nodeData[key][0];
            } else {
              cData = nodeData[key];
              cName = key;
            }
            if (cData["@android:name"]) {
              cName = `${key}(${cData["@android:name"]})`;
            } else if (cData["@android:scheme"]) {
              cName = `${key}(scheme:${cData["@android:scheme"]})`;
            } else {
              cName = key;
            }

            let childNode = { name: cName, children: [], pNode: null ,ckbool:true};
            node.children.push(childNode);
            nodeIdStart++;
            childNode.id = nodeIdStart;
            childNode.parentId = node.id;
            childNode.rawData={key:key,value:cData};
            this.createTreeData(childNode, cData);
          }
        }
      }
    }
  },

  components: {
    vueZtree
  },
  mounted() {
    // $.ajax({
    //   url: "http://img.cdn.dx.uwan.com/test/AndroidManifest.xml",
    //   async: false,
    //   dataType: "text",
    //   success: function(data2) {
    //     console.log(data2);
    //   }
    // });
    //   let maniXML = require('../AndroidManifest.xml');

    // console.log(maniXML);
    const xml2js = require("xml2js");
    let parser = new xml2js.Parser();
    let rootNode = [{ name: "manifest", children: [] }];
    parser.parseString(xmlStr, (err, result) => {
      console.log(result);

      //   this.deepCloneAndTranslate(rootNode[0], result);
      //   // let application=rootNode["manifest"]["application"][0];
      //   // application["name"]="Application"
      //   // let manifest=rootNode["manifest"];
      //   // manifest["name"]="manifest"
      //   this.ztreeDataSource = rootNode; //[{"name":"Application",children:[]}];
      //   // console.log(rootNode);

      let rootNode2 = {};
      this.deepCloneAndTranslate2(rootNode2, result);
      this.ztreeRawDatas=rootNode2;
      let rootNode3 = { name: "", children: [], id: 0, parentId: 0 };
      this.createTreeData(rootNode3, rootNode2);
      this.ztreeDataSource = rootNode3.children;
    });
    // // 异步获取数据操作
    // setTimeout(() => {
    //   this.ztreeDataSource = [
    //     {
    //       id: 220,
    //       parentId: 0,
    //       name: "游戏1",
    //       children: [
    //         {
    //           id: 221,
    //           parentId: 220,
    //           name: "游戏2",
    //           path: "",
    //           children: [
    //             {
    //               id: 222,
    //               parentId: 221,
    //               name: "游戏3",
    //               path: "",
    //               children: [
    //                 {
    //                   id: 223,
    //                   parentId: 222,
    //                   name: "游戏4",
    //                   path: "",
    //                   children: [
    //                     {
    //                       id: 224,
    //                       parentId: 223,
    //                       name: "游戏5",
    //                       path: "",
    //                       children: [
    //                         {
    //                           id: 225,
    //                           parentId: 224,
    //                           name: "游戏6",
    //                           path: "",
    //                           children: [
    //                             {
    //                               id: 226,
    //                               parentId: 224,
    //                               name: "游戏末节点",
    //                               path: ""
    //                             }
    //                           ]
    //                         }
    //                       ]
    //                     }
    //                   ]
    //                 }
    //               ]
    //             }
    //           ]
    //         }
    //       ],
    //       path: "http://www.baidu.com"
    //     },
    //     {
    //       id: 1,
    //       parentId: 0,
    //       name: "音乐",
    //       children: [],
    //       path: "http://www.baidu.com"
    //     },
    //     {
    //       id: 2,
    //       parentId: 0,
    //       name: "视频",
    //       children: [
    //         {
    //           id: 3,
    //           parentId: 2,
    //           name: "电影",
    //           children: [
    //             {
    //               id: 4,
    //               parentId: 3,
    //               name: "国产电影",
    //               path: ""
    //             },
    //             {
    //               id: 5,
    //               parentId: 3,
    //               name: "好莱坞电影",
    //               path: ""
    //             },
    //             {
    //               id: 6,
    //               parentId: 3,
    //               name: "小语种电影",
    //               path: ""
    //             }
    //           ]
    //         },
    //         {
    //           id: 7,
    //           parentId: 2,
    //           name: "短片",
    //           children: [
    //             {
    //               id: 9,
    //               parentId: 7,
    //               name: "电视剧",
    //               path: ""
    //             },
    //             {
    //               id: 10,
    //               parentId: 7,
    //               name: "短片",
    //               path: ""
    //             }
    //           ]
    //         }
    //       ],
    //       path: ""
    //     }
    //   ];
    // }, 1000);
  }
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
