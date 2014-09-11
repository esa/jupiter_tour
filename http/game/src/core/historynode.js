/* Class HistoryNode
    Basically a TreeNode extended with some additional informations.
*/

core.HistoryNode = function (gameState, key, virtual) {
    datastructure.TreeNode.call(this, key, gameState);
    this._historySequenceNr = 0;
    this._isVirtual = virtual != null ? virtual : false;
};
core.HistoryNode.prototype = Object.create(datastructure.TreeNode.prototype);
core.HistoryNode.prototype.constructor = core.HistoryNode;

core.HistoryNode.prototype.setHistorySequenceNr = function (number) {
    this._historySequenceNr = number;
};

core.HistoryNode.prototype.getHistorySequenceNr = function () {
    return this._historySequenceNr;
};

core.HistoryNode.prototype.isVirtual = function () {
    return this._isVirtual;
};

core.HistoryNode.prototype.setVirtual = function (virtual) {
    this._isVirtual = virtual;
};

core.HistoryNode.prototype.addChild = function (gameState, key, virtual) {
    var child = new core.HistoryNode(gameState, key, virtual);
    if (this._childs[child.getKey()] != null) {
        return null;
    }
    this._childs[child.getKey()] = child;
    child.setParent(this);
    return child;
};