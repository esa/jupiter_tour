/* Class FIFO Queue */

datastructure.Queue = function () {
    this._startNode = null;
    this._endNode = null;
    this._size = 0;
};

datastructure.Queue.prototype = {
    constructor: datastructure.Queue,

    isEmpty: function () {
        return (this._size == 0);
    },

    front: function () {
        if (this._endNode) {
            return this._endNode._value;
        } else {
            return null;
        }
    },

    push: function (value) {
        var newNode = {};
        newNode._value = value;
        newNode._prevNode = null;
        newNode._nextNode = null;
        if (this.isEmpty()) {
            this._startNode = newNode;
            this._endNode = newNode;
        } else {
            newNode._nextNode = this._startNode;
            this._startNode._prevNode = newNode;
            this._startNode = newNode;
        }
        this._size++;
    },

    pop: function () {
        if (this._endNode) {
            this._endNode = this._endNode._prevNode;
            if (this._endNode == null) {
                this._startNode = null;
                this._size = 0;
            } else {
                this._size--;
            }
        }
    },

    size: function () {
        return this._size;
    }
};