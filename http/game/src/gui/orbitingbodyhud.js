/* Class OrbitingBodyHUD 
    Consider this class abstract.
    Inherit from it and make sure you have at least the members this._backgroundElement and this._containerElement which point to divs in your child class.
*/
gui.OrbitingBodyHUD = function (orbitingBody) {
    var self = this;
    this._id = gui.createID();
    this._orbitingBody = orbitingBody;
    this._bodyScale = orbitingBody.getScale();
    this._screenPosition = new geometry.Vector2();
    this._viewDistance = 0;
    this._viewDirection = gui.ScreenDirections.UP;
    this._isVisible = false;
    this._isEditable = false;

    this._backgroundName = '';
    this._backgroundHeightFactorUD = 1;
    this._backgroundWidthFactorUD = 1;
    this._backgroundHeightFactorLR = 1;
    this._backgroundWidthFactorLR = 1;
    this._containerHeightFactor = 1;
    this._containerMarginFactorL = 1;
    this._containerMarginFactorT = 1;
    this._containerWidthFactor = 1;
    this._marginUD = 0;
    this._marginLR = 0;

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
gui.OrbitingBodyHUD.prototype = {
    constructor: gui.OrbitingBodyHUD,

    _onMove: function () {},

    _onResize: function () {},

    _onMouseMove: function (event) {},

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

    _updateCSS: function () {
        this._containerElement.style.marginTop = '0px';
        this._containerElement.style.marginLeft = '0px';
        this._containerElement.style.width = '100%';
        this._containerElement.style.height = '100%';

        var backgroundHeight;
        var backgroundWidth;
        var left;
        var top;
        switch (this._viewDirection) {
        case gui.ScreenDirections.UP:
            backgroundHeight = Math.round(window.innerHeight * this._backgroundHeightFactorUD);
            backgroundWidth = Math.round(backgroundHeight * this._backgroundWidthFactorUD);
            this._backgroundElement.style.width = utility.toPixelString(backgroundWidth);
            this._backgroundElement.style.height = utility.toPixelString(backgroundHeight);
            left = this._screenPosition.getX() - $(this._backgroundElement).outerWidth() / 2;
            top = this._screenPosition.getY() - $(this._backgroundElement).outerHeight() - this._orbitingBody.getRadius() * window.innerHeight * this._marginUD * this._bodyScale / this._viewDistance * gui.POSITION_SCALE;
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
            top = this._screenPosition.getY() + this._orbitingBody.getRadius() * window.innerHeight * this._marginUD * this._bodyScale / this._viewDistance * gui.POSITION_SCALE;
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
            left = this._screenPosition.getX() - $(this._backgroundElement).outerWidth() - this._orbitingBody.getRadius() * window.innerWidth * this._marginLR * this._bodyScale / this._viewDistance * gui.POSITION_SCALE;
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
            left = this._screenPosition.getX() + this._orbitingBody.getRadius() * window.innerWidth * this._marginLR * this._bodyScale / this._viewDistance * gui.POSITION_SCALE;
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

    show: function () {},

    hide: function () {},

    update: function (screenPosition) {
        if (this._isVisible) {
            if (this._screenPosition.clone().sub(screenPosition).dotMe() > 0) {
                this._screenPosition = screenPosition.clone();
                var valX = this._screenPosition.getX();
                var valY = this._screenPosition.getY();
                if (valX + $(this._backgroundElement).outerWidth() /
                    2 > window.innerWidth) {
                    this._viewDirection = gui.ScreenDirections.LEFT;
                } else if (valX - $(this._backgroundElement).outerWidth() / 2 < 0) {
                    this._viewDirection = gui.ScreenDirections.RIGHT;
                } else if (valY - $(this._backgroundElement).outerHeight() - this._orbitingBody.getRadius() / this._viewDistance * gui.POSITION_SCALE < 0) {
                    this._viewDirection = gui.ScreenDirections.DOWN;
                } else {
                    this._viewDirection = gui.ScreenDirections.UP;
                }

                this._updateCSS();
                this._onMove();
            }
        }
    },

    onViewChange: function (viewDistance) {
        this._viewDistance = viewDistance;
    }
};