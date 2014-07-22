/* Class OrbitingBodySelector 
    Consider this class abstract.
    Inherit from it and make sure you have at least the members this._backgroundElement and this._containerElement which point to divs in your child class.
*/
gui.OrbitingBodySelector = function (orbitingBody) {
    var self = this;
    this._id = gui.createID();
    this._orbitingBody = orbitingBody;
    this._bodyScale = orbitingBody.getScale();
    this._screenPosition = new geometry.Vector2();
    this._cameraPosition = new geometry.Vector3();
    this._viewDirection = gui.ScreenDirections.UP;
    this._isVisible = false;
    this._isEditable = false;
    this._isActivated = false;

    this._configuration = {};

    this._backgroundName = '';
    this._backgroundHeightFactorUD = 1;
    this._backgroundWidthFactorUD = 1;
    this._backgroundHeightFactorLR = 1;
    this._backgroundWidthFactorLR = 1;
    this._containerHeightFactor = 1;
    this._containerMarginFactorL = 1;
    this._containerMarginFactorT = 1;
    this._containerWidthFactor = 1;

    this._boundingBox = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };

    window.addEventListener('resize', function (event) {
        self._updateCSS();
        self._onResize(event);
    });
    var mouseDriver = new utility.MouseDriver(document.body);
    mouseDriver.registerMove(function (event) {
        self._checkForMouseHover(event);
        self._onMouseMove(event);
    });
};
gui.OrbitingBodySelector.prototype = {
    constructor: gui.OrbitingBodySelector,

    _onMove: function () {},

    _onResize: function () {},

    _onMouseMove: function (event) {},

    _resetSelection: function () {},

    _checkForMouseHover: function (event) {
        if (this._isVisible) {
            var mouseX = event.clientX;
            var mouseY = event.clientY;

            var box = this._boundingBox;

            if ((mouseX == 0 && mouseY == 0) || ((mouseX >= box.left) && (mouseX <= box.right) && (mouseY >= box.top) && (mouseY <= box.bottom))) {
                this._orbitingBody.onConfigurationWindowOver();
            } else {
                this._orbitingBody.onConfigurationWindowOut();
            }
        }
    },

    _computeBodyRadius: function () {
        var bodySize = this._orbitingBody.getBodyMeshSize();
        var bodyDistance = this._cameraPosition.clone().sub(this._orbitingBody.getPosition().multiplyScalar(gui.POSITION_SCALE).asTHREE()).length();
        var bodyRadius = window.innerHeight / (bodyDistance * Math.sin(gui.FIELD_OF_VIEW / 2)) * bodySize.radius;
        return bodyRadius;
    },

    _updateCSS: function () {
        this._containerElement.style.marginTop = '0px';
        this._containerElement.style.marginLeft = '0px';
        this._containerElement.style.width = '100%';
        this._containerElement.style.height = '100%';

        var backgroundHeight;
        var backgroundWidth;
        var left;
        var top;
        var bodyRadius = this._computeBodyRadius();

        switch (this._viewDirection) {
        case gui.ScreenDirections.UP:
            backgroundHeight = Math.round(window.innerHeight * this._backgroundHeightFactorUD);
            backgroundWidth = Math.round(backgroundHeight * this._backgroundWidthFactorUD);
            this._backgroundElement.style.width = utility.toPixelString(backgroundWidth);
            this._backgroundElement.style.height = utility.toPixelString(backgroundHeight);
            left = this._screenPosition.getX() - $(this._backgroundElement).outerWidth() / 2;
            top = this._screenPosition.getY() - $(this._backgroundElement).outerHeight() - bodyRadius;
            this._backgroundElement.style.left = utility.toPixelString(left, true);
            this._backgroundElement.style.top = utility.toPixelString(top, true);
            if (this._backgroundElement.style.backgroundImage.indexOf('res/svg/' + this._backgroundName + 'viewup.svg)') == -1) {
                this._backgroundElement.style.backgroundImage = 'url(res/svg/' + this._backgroundName + 'viewup.svg)';
            }
            this._containerElement.style.height = utility.toPixelString(backgroundHeight * this._containerHeightFactor);
            break;
        case gui.ScreenDirections.DOWN:
            backgroundHeight = Math.round(window.innerHeight * this._backgroundHeightFactorUD);
            backgroundWidth = Math.round(backgroundHeight * this._backgroundWidthFactorUD);
            this._backgroundElement.style.width = utility.toPixelString(backgroundWidth);
            this._backgroundElement.style.height = utility.toPixelString(backgroundHeight);
            left = this._screenPosition.getX() - $(this._backgroundElement).outerWidth() / 2;
            top = this._screenPosition.getY() + bodyRadius;
            this._backgroundElement.style.left = utility.toPixelString(left, true);
            this._backgroundElement.style.top = utility.toPixelString(top, true);
            if (this._backgroundElement.style.backgroundImage.indexOf('res/svg/' + this._backgroundName + 'viewdown.svg)') == -1) {
                this._backgroundElement.style.backgroundImage = 'url(res/svg/' + this._backgroundName + 'viewdown.svg)';
            }
            this._containerElement.style.marginTop = utility.toPixelString(backgroundHeight * this._containerMarginFactorT);
            this._containerElement.style.height = utility.toPixelString(backgroundHeight * this._containerHeightFactor);
            break;
        case gui.ScreenDirections.LEFT:
            backgroundHeight = Math.round(window.innerHeight * this._backgroundHeightFactorLR);
            backgroundWidth = Math.round(backgroundHeight * this._backgroundWidthFactorLR);
            this._backgroundElement.style.width = utility.toPixelString(backgroundWidth);
            this._backgroundElement.style.height = utility.toPixelString(backgroundHeight);
            left = this._screenPosition.getX() - $(this._backgroundElement).outerWidth() - bodyRadius;
            top = this._screenPosition.getY() - $(this._backgroundElement).outerHeight() / 2;
            this._backgroundElement.style.left = utility.toPixelString(left, true);
            this._backgroundElement.style.top = utility.toPixelString(top, true);
            if (this._backgroundElement.style.backgroundImage.indexOf('res/svg/' + this._backgroundName + 'viewleft.svg)') == -1) {
                this._backgroundElement.style.backgroundImage = 'url(res/svg/' + this._backgroundName + 'viewleft.svg)';
            }
            this._containerElement.style.width = utility.toPixelString(backgroundWidth * this._containerWidthFactor);
            break;
        case gui.ScreenDirections.RIGHT:
            backgroundHeight = Math.round(window.innerHeight * this._backgroundHeightFactorLR);
            backgroundWidth = Math.round(backgroundHeight * this._backgroundWidthFactorLR);
            this._backgroundElement.style.width = utility.toPixelString(backgroundWidth);
            this._backgroundElement.style.height = utility.toPixelString(backgroundHeight);
            left = this._screenPosition.getX() + bodyRadius;
            top = this._screenPosition.getY() - $(this._backgroundElement).outerHeight() / 2;
            this._backgroundElement.style.left = utility.toPixelString(left, true);
            this._backgroundElement.style.top = utility.toPixelString(top, true);
            if (this._backgroundElement.style.backgroundImage.indexOf('res/svg/' + this._backgroundName + 'viewright.svg)') == -1) {
                this._backgroundElement.style.backgroundImage = 'url(res/svg/' + this._backgroundName + 'viewright.svg)';
            }
            this._containerElement.style.marginLeft = utility.toPixelString(backgroundWidth * this._containerMarginFactorL);
            this._containerElement.style.width = utility.toPixelString(backgroundWidth * this._containerWidthFactor);
            break;
        }
        this._boundingBox = {
            left: left,
            right: left + backgroundWidth,
            top: top,
            bottom: top + backgroundHeight
        };
    },

    _confirmAndClose: function () {},

    isVisible: function () {
        return this._isVisible;
    },

    onActivated: function () {
        this._isActivated = true;
    },

    onDeactivated: function () {
        this._isActivated = false;
    },

    show: function () {},

    hide: function () {},

    update: function (screenPosition) {
        if (this._isVisible) {
            if (this._screenPosition.clone().sub(screenPosition).dotMe() > 0) {
                this._screenPosition = screenPosition.clone();
                var valX = this._screenPosition.getX();
                var valY = this._screenPosition.getY();
                var bBox = this._boundingBox;
                var bodyRadius = this._computeBodyRadius();

                if (valX + (bBox.right - bBox.left) / 2 > window.innerWidth) {
                    this._viewDirection = gui.ScreenDirections.LEFT;
                } else if (valX - (bBox.right - bBox.left) / 2 < 0) {
                    this._viewDirection = gui.ScreenDirections.RIGHT;
                } else if (valY - (bBox.bottom - bBox.top) - bodyRadius < 0) {
                    this._viewDirection = gui.ScreenDirections.DOWN;
                } else {
                    this._viewDirection = gui.ScreenDirections.UP;
                }

                this._updateCSS();
                this._onMove();
            }
        }
    },

    onViewChange: function (cameraPosition) {
        this._cameraPosition = cameraPosition.clone();
    },

    getDefaultConfiguration: function () {
        this._resetSelection();
        return utility.clone(this._configuration);
    }
};