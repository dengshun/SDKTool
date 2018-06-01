const xmlbuilder = require("xmlbuilder")

function APKManifest() {
    this.rootNode = null;
    this.applicationNode = null;
    this.activityNodes = null;
    this.metaDataNodes = null;
    this.usesPermissionNodes = null;
}
APKManifest.prototype.initData = function(obj) {
    this.rootNode = {};
    this.deepCloneAndTranslate(this.rootNode, obj);
    this.applicationNode = this.rootNode["manifest"]["application"][0];
    this.activityNodes = this.applicationNode["activity"];
    this.metaDataNodes = this.applicationNode["meta-data"];
    this.usesPermissionNodes = this.rootNode["manifest"]["uses-permission"];
    // this.applicationNode["@android:name"] = "com.uwan.android.VivoApplication";
    console.log("activityNodes:=========================");
    console.table(this.activityNodes);
    console.log("metaDataNodes:=========================");
    console.table(this.metaDataNodes);
    console.log("usesPermissionNodes:=========================");
    console.table(this.usesPermissionNodes);
    console.log(this.makeXMLString());

}
APKManifest.prototype.deepCloneAndTranslate = function(root, obj) {
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
                        this.deepCloneAndTranslate(node[key], value);
                    } else if (value instanceof Object) {
                        node[key] = {};
                        this.deepCloneAndTranslate(node[key], value);
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
            this.deepCloneAndTranslate(root, elem);
        }
    }
}
APKManifest.prototype.mergeActivity = function(list) {
    for (let activity of list) {
        let found = false;
        for (let existActivity of this.activityNodes) {
            if (existActivity["@android:name"] === activity["@android:name"]) {
                found = true;
                break;
            }
        }
        if (!found) {
            this.activityNodes.push(activity);
        }
    }
}
APKManifest.prototype.mergeMetaData = function(list) {
    if (list && list.length > 0) {
        if (!this.metaDataNodes) {
            this.metaDataNodes = [];
        }
        for (let metaData of list) {
            let found = false;
            for (let old of this.metaDataNodes) {
                if (old["@android:name"] === metaData["@android:name"]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.metaDataNodes.push(metaData);
            }
        }
    }
}
APKManifest.prototype.mergePermission = function(list) {
    if (list && list.length > 0) {
        if (!this.usesPermissionNodes) {
            this.usesPermissionNodes = [];
        }
        for (let permission of list) {
            let found = false;
            for (let existPermission of this.usesPermissionNodes) {
                if (existPermission["@android:name"] === permission["@android:name"]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.usesPermissionNodes.push(permission);
            }
        }
    }
}
APKManifest.prototype.makeXMLString = function() {
    let feed = xmlbuilder.create(this.rootNode, { encoding: 'utf-8' });
    return feed.end({ pretty: true });
}
APKManifest.prototype.getPackageName = function() {
    return this.rootNode["manifest"]["@package"];
}
APKManifest.prototype.modifyPackageName = function(newName) {
    this.rootNode["manifest"]["@package"] = newName;
}
APKManifest.prototype.getAppLabel = function() {
    return this.applicationNode["@android:label"];
}
APKManifest.prototype.updateAppLabel = function(label) {
    this.applicationNode["@android:label"] = label;
}
export default APKManifest;