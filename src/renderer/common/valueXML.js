const xmlbuilder = require("xmlbuilder")

function ValueXML() {
    this.rootNode = null;
    this.isDirty = false;
}
ValueXML.prototype.initData = function(obj) {
    this.isDirty = false;
    this.rootNode = {};
    this.deepCloneAndTranslate(this.rootNode, obj);
}

ValueXML.prototype.deepCloneAndTranslate = function(root, obj) {
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


ValueXML.prototype.makeXMLString = function() {
    let feed = xmlbuilder.create(this.rootNode, { encoding: 'utf-8' });
    return feed.end({ pretty: true });
}

ValueXML.prototype.removeRepeatChildNode = function(keyPrefix, referDic) {
    let resNode = this.rootNode["resources"];
    for (let resProp in resNode) {
        let resChildNodes = resNode[resProp];
        let len = resChildNodes.length;
        for (let i = 0; i < len; i++) {
            let resChildNodeObj = resChildNodes[i];
            let key = keyPrefix + "##" + resProp + "##" + (resChildNodeObj["@name"]);
            if (referDic.hasOwnProperty(key)) {
                resChildNodes.splice(i, 1);
                this.isDirty = true;
                console.log("find a repeat node================:" + key);
                i--;
                len--;
            }
        }
        if (len <= 0) {
            delete resNode[resProp];
        }
    }
}
ValueXML.prototype.updateStringValueByAttr = function(attrName, value) {
    let strNodes = this.rootNode["resources"]["string"];
    if (strNodes) {
        for (let node of strNodes) {
            if (node["@name"] === attrName) {
                if (node["#text"] != value) {
                    node["#text"] = value;
                    this.isDirty = true;
                }
                break;
            }
        }
    }
}
export default ValueXML