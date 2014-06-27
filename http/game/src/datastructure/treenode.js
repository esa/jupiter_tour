/* Class TreeNode 
    Represents a node in a tree. 
*/
datastructure.TreeNode = function (key, value) {
    this._key = key || datastructure.createID();
    this._childs = {};
    this._value = value;
    this._parent = null;
};
datastructure.TreeNode.prototype = {
    constructor: datastructure.TreeNode,

    setValue: function (value) {
        this._value = value;
    },

    getValue: function () {
        return this._value;
    },

    getKey: function () {
        return this._key;
    },

    addChild: function (key, value) {
        var child = new datastructure.TreeNode(key, value);
        this._childs[child.getKey()] = child;
        child.setParent(this);
        return child;
    },

    getChilds: function () {
        return this._childs;
    },

    setParent: function (parent) {
        this._parent = parent;
    },

    getParent: function () {
        return this._parent;
    }
};