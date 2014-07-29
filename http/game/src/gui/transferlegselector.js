/* Class TransferLegSelector   
    Displays a window with which the user can decide between a Flyby and a Landing
*/
gui.TransferLegSelector = function (orbitingBody) {
    gui.OrbitingBodySelector.call(this, orbitingBody);
    var self = this;

    this._backgroundName = 'simpleselector';
    this._backgroundHeightFactorLR = 0.15;
    this._backgroundHeightFactorUD = 0.15;
    this._backgroundWidthFactorLR = 3.00;
    this._backgroundWidthFactorUD = 2.745;
    this._containerHeightFactor = 0.76;
    this._containerWidthFactor = 0.92;
    this._containerMarginFactorL = 0.08;
    this._containerMarginFactorT = 0.24;

    var backgroundHeight = Math.round(window.innerHeight * this._backgroundHeightFactorUD);
    var backgroundWidth = Math.round(backgroundHeight * this._backgroundWidthFactorUD);

    this._backgroundElement = document.createElement('div');
    this._backgroundElement.className = 'transferleg-selector unselectable';
    this._backgroundElement.style.width = utility.toPixelString(backgroundWidth);
    this._backgroundElement.style.height = utility.toPixelString(backgroundHeight);
    this._backgroundElement.style.backgroundImage = 'url(res/svg/' + this._backgroundName + 'viewup.svg)';
    this._backgroundElement.style.display = 'none';
    this._backgroundElement.oncontextmenu = function () {
        return false;
    };

    this._containerElement = document.createElement('div');
    this._containerElement.className = 'container text-fit';
    this._containerElement.style.width = '100%';
    this._containerElement.style.height = utility.toPixelString(backgroundHeight * this._containerHeightFactor);

    var contextWrapper = document.createElement('div');
    contextWrapper.className = 'context-wrapper';

    this._infoWrapper = document.createElement('div');
    this._infoWrapper.className = 'info-wrapper';

    var titleElement = document.createElement('div');
    titleElement.className = 'title';
    titleElement.textContent = this._orbitingBody.getName();
    this._infoWrapper.appendChild(titleElement);
    contextWrapper.appendChild(this._infoWrapper);

    this._questionBoxWrapper = document.createElement('div');
    this._questionBoxWrapper.className = 'content-wrapper';

    var flybyButtonCol = document.createElement('div');
    flybyButtonCol.className = 'button-col';
    var flybyButton = document.createElement('img');
    flybyButton.onclick = function () {
        self._userAction.nextLeg.performLanding = false;
        self._confirmAndClose();
    };
    flybyButton.className = 'button center-vertically center-horizontally';
    flybyButton.title = 'perform flyby at ' + this._orbitingBody.getName();
    flybyButton.src = 'res/svg/flyby.svg';
    flybyButtonCol.appendChild(flybyButton);

    var landingButtonCol = document.createElement('div');
    landingButtonCol.className = 'button-col';
    var landingButton = document.createElement('img');
    landingButton.onclick = function () {
        self._userAction.nextLeg.performLanding = true;
        self._confirmAndClose();
    };
    landingButton.className = 'button center-vertically center-horizontally';
    landingButton.title = 'perform landing at ' + this._orbitingBody.getName();
    landingButton.src = 'res/svg/landing.svg';
    landingButtonCol.appendChild(landingButton);

    this._questionBoxWrapper.appendChild(flybyButtonCol);
    this._questionBoxWrapper.appendChild(landingButtonCol);

    contextWrapper.appendChild(this._questionBoxWrapper);
    this._containerElement.appendChild(contextWrapper);
    this._backgroundElement.appendChild(this._containerElement);
    document.body.appendChild(this._backgroundElement);
};
gui.TransferLegSelector.prototype = Object.create(gui.OrbitingBodySelector.prototype);
gui.TransferLegSelector.prototype.constructor = gui.TransferLegSelector;

gui.TransferLegSelector.prototype._resetSelection = function () {
    this._userAction.nextLeg.performLanding = false;
};

gui.TransferLegSelector.prototype._confirmAndClose = function () {
    this.hide();
    this._orbitingBody.onConfigurationDone(true, this._configuration);
};

gui.TransferLegSelector.prototype.show = function (userAction) {
    this._userAction = userAction;
    this._editable = this._userAction != null;

    this._backgroundElement.style.display = 'block';
    if (this._editable) {
        this._infoWrapper.style.display =  'none';
        this._questionBoxWrapper.style.display = 'block';
    } else {
        this._questionBoxWrapper.style.display = 'none';
        this._infoWrapper.style.display = 'flex';
    }
    this._isVisible = true;
    utility.fitText();
};

gui.TransferLegSelector.prototype.hide = function () {
    this._backgroundElement.style.display = 'none';
    this._isVisible = false;
    this._orbitingBody.onConfigurationWindowOut();
};