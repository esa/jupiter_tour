/* Class MouseDriver
    Handles mouse events and notifies all subscribers
    requires jQuery
*/
utility.MouseDriver = function (domElement, clickSpeed) {
    var self = this;
    this._domElement = domElement;

    $(this._domElement).css('-webkit-touch-callout', 'none');
    $(this._domElement).css('-webkit-user-select', 'none');
    $(this._domElement).css('-khtml-user-select', 'none');
    $(this._domElement).css('-moz-user-select', 'none');
    $(this._domElement).css('-ms-user-select', 'none');
    $(this._domElement).css('user-select', 'none');

    this._leftClickSubscribers = [];
    this._rightClickSubscribers = [];
    this._leftDblClickSubscribers = [];
    this._rightDblClickSubscribers = [];
    this._wheelSubscribers = [];
    this._moveSubscribers = [];
    this._leftDragSubscribers = [];
    this._rightDragSubscribers = [];
    this._rightUpSubscribers = [];
    this._leftUpSubscribers = [];
    this._leftDownSubscribers = [];
    this._rightDownSubscribers = [];

    var Buttons = {
        LEFT: 0,
        RIGHT: 2,
        NONE: -1
    };

    var lastX = 0;
    var lastY = 0;

    this._domElement.oncontextmenu = function () {
        return false;
    };
    this._domElement.ondragstart = function () {
        return false;
    };

    clickSpeed = clickSpeed || 150;
    var dblClickSpeed = clickSpeed * 2;

    var leftButtonDown = null;
    var leftButtonClicks = 0;
    var rightButtonDown = null;
    var rightButtonClicks = 0;
    var leftButtonTimeoutID = 0;
    var rightButtonTimeoutID = 0;

    this._domElement.addEventListener('mousedown', function (event) {
        switch (event.button) {
        case Buttons.LEFT:
            leftButtonDown = new Date();
            self._publishLeftDown(event);
            break;
        case Buttons.RIGHT:
            rightButtonDown = new Date();
            self._publishRightDown(event);
            break;
        }
    }, false);

    window.addEventListener('mouseup', function (event) {
        var now = new Date();
        switch (event.button) {
        case Buttons.LEFT:
            if (leftButtonDown) {
                var time = now.getTime() - leftButtonDown.getTime();
                if (time <= clickSpeed) {
                    leftButtonClicks++;
                    clearTimeout(leftButtonTimeoutID);
                    leftButtonTimeoutID = setTimeout(function () {
                        if (leftButtonClicks == 1) {
                            self._publishLeftClick(event);
                        } else {
                            self._publishLeftDblClick(event);
                        }
                        leftButtonClicks = 0;
                    }, dblClickSpeed);
                }
                leftButtonDown = null;
            }
            self._publishLeftUp(event);
            break;
        case Buttons.RIGHT:
            if (rightButtonDown) {
                var time = now.getTime() - rightButtonDown.getTime();
                if (time <= clickSpeed) {
                    rightButtonClicks++;
                    clearTimeout(rightButtonTimeoutID);
                    rightButtonTimeoutID = setTimeout(function () {
                        if (rightButtonClicks == 1) {
                            self._publishRightClick(event);
                        } else {
                            self._publishRightDblClick(event);
                        }
                        rightButtonClicks = 0;
                    }, dblClickSpeed);
                }
                rightButtonDown = null;
            }
            self._publishRightUp(event);
            break;
        }
    }, false);

    var deltaX = 0;
    var deltaY = 0;
    window.addEventListener('mousemove', function (event) {
        deltaX = event.clientX - lastX;
        deltaY = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;

        self._publishMove(event);

        event.deltaX = deltaX;
        event.deltaY = deltaY;

        if (leftButtonDown && !leftButtonClicks) {
            self._publishLeftDrag(event);
        }
        if (rightButtonDown && !rightButtonClicks) {
            self._publishRightDrag(event);
        }
    });

    this._domElement.addEventListener(utility.MOUSE_WHEEL_EVENT, function (event) {
        self._publishWheel(event);
    });
};
utility.MouseDriver.prototype = {
    constructor: utility.MouseDriver,

    _publishLeftClick: function (event) {
        this._leftClickSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishRightClick: function (event) {
        this._rightClickSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishLeftDblClick: function (event) {
        this._leftDblClickSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishRightDblClick: function (event) {
        this._rightDblClickSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishWheel: function (event) {
        this._wheelSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishLeftDrag: function (event) {
        this._leftDragSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishRightDrag: function (event) {
        this._rightDragSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishMove: function (event) {
        this._moveSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishLeftUp: function (event) {
        this._leftUpSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishRightUp: function (event) {
        this._rightUpSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishLeftDown: function (event) {
        this._leftDownSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    _publishRightDown: function (event) {
        this._rightDownSubscribers.forEach(function (callback) {
            callback(event);
        });
    },

    registerLeftClick: function (callback) {
        this._leftClickSubscribers.push(callback);
    },

    registerRightClick: function (callback) {
        this._rightClickSubscribers.push(callback);
    },

    registerLeftDblClick: function (callback) {
        this._leftDblClickSubscribers.push(callback);
    },

    registerRightDblClick: function (callback) {
        this._rightDblClickSubscribers.push(callback);
    },

    registerLeftDrag: function (callback) {
        this._leftDragSubscribers.push(callback);
    },

    registerRightDrag: function (callback) {
        this._rightDragSubscribers.push(callback);
    },

    registerWheel: function (callback) {
        this._wheelSubscribers.push(callback);
    },

    registerMove: function (callback) {
        this._moveSubscribers.push(callback);
    },

    registerLeftUp: function (callback) {
        this._leftUpSubscribers.push(callback);
    },

    registerRightUp: function (callback) {
        this._rightUpSubscribers.push(callback);
    },

    registerLeftDown: function (callback) {
        this._leftDownSubscribers.push(callback);
    },

    registerRightDown: function (callback) {
        this._rightDownSubscribers.push(callback);
    }
};