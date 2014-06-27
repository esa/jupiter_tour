/* Class HistoryNode
    Basically a TreeNode extended with some additional informations.
*/

core.HistoryNode = function (gameState, key) {
    datastructure.TreeNode.call(this, key, gameState);
    this._historySequenceNr = 0;
};
core.HistoryNode.prototype = Object.create(datastructure.TreeNode.prototype);
core.HistoryNode.prototype.constructor = core.HistoryNode;

core.HistoryNode.prototype.setHistorySequenceNr = function (number) {
    this._historySequenceNr = number;
};

core.HistoryNode.prototype.getHistorySequenceNr = function () {
    return this._historySequenceNr;
};

core.HistoryNode.prototype.addChild = function (gameState, key) {
    var child = new core.HistoryNode(gameState, key);
    if (this._childs[child.getKey()] != null) {
        return null;
    }
    this._childs[child.getKey()] = child;
    child.setParent(this);
    return child;
};