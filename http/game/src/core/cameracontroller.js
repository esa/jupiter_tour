/* Class CameraController
 */
core.CameraController = function (gameEngine) {
    var self = this;
    this._gameEngine = gameEngine;
    this._camera = this._gameEngine.getCamera();
    this._domElement = this._gameEngine.getDomElement();
    this._focus = null;
    this._phi = 0;
    this._theta = 0;
    this._radius = 0;
    this._minRadius = 0;
    this._maxRadius = 0;
    this._radiusScaling = 0;
    var mouseDriver = new utility.MouseDriver(this._domElement);
    mouseDriver.registerRightDrag(function (event) {
        self._onMouseDrag(event);
    });
    mouseDriver.registerWheel(function (event) {
        self._onMouseWheel(event);
    });
};
core.CameraController.prototype = {
    constructor: core.CameraController,

    _onMouseWheel: function (event) {
        var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
        this._radius -= delta * this._radiusScaling;
        this._radius = Math.min(Math.max(this._minRadius, this._radius), this._maxRadius);
        this._radiusScaling = this._radius / 20;
    },

    _onMouseDrag: function (event) {
        var diffX = event.deltaX;
        var diffY = event.deltaY;
        this._phi -= diffX / this._domElement.width * Math.PI / 2;
        this._theta += diffY / this._domElement.height * Math.PI / 2;

        this._theta = Math.max(-Math.PI + 0.1, Math.min(-0.1, this._theta));
        while (this._phi > 2 * Math.PI) {
            this._phi -= 2 * Math.PI;
        }
        while (this._phi < 0) {
            this._phi += 2 * Math.PI;
        }
    },

    start: function () {},

    update: function () {
        var focusPosition = this._focus.getPosition().multiplyScalar(gui.POSITION_SCALE);

        var radius = this._radius;
        var theta = this._theta;
        var phi = this._phi;

        var oldPosition = this._camera.position.clone();
        this._camera.position.set(focusPosition.getX() + radius * Math.sin(theta) * Math.cos(phi), focusPosition.getY() + radius * Math.sin(theta) * Math.sin(phi), focusPosition.getZ() + radius * Math.cos(theta));

        this._camera.lookAt(focusPosition.asTHREE());
    },

    setFocus: function (focus) {
        this._focus = focus;
        this._minRadius = focus.getRadius() * 0.5e2 * gui.POSITION_SCALE;
        this._maxRadius = focus.getRadius() * 1e2 * gui.POSITION_SCALE;
        this._radiusScaling = (this._maxRadius - this._minRadius) / 30;
        this._radius = (this._minRadius + this._maxRadius) / 2;
        this._phi = Math.PI / 4;
        this._theta = -Math.PI / 5;
    },

    setMinRadius: function (radius) {
        this._minRadius = radius * gui.POSITION_SCALE;
        this._radiusScaling = (this._maxRadius - this._minRadius) / 30;
        this._radius = this._maxRadius;
    },

    setMaxRadius: function (radius) {
        this._maxRadius = radius * gui.POSITION_SCALE;
        this._radiusScaling = (this._maxRadius - this._minRadius) / 30;
        this._radius = this._maxRadius;
    }
};