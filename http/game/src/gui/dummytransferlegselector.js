/* Class DummyTransferLegSelector
    Serves as a stub to disable the transferleg type selection.
*/
gui.DummyTransferLegSelector = function (orbitingBody, performLanding) {
    gui.OrbitingBodySelector.call(this, orbitingBody);

    this._configuration = {
        performLanding: performLanding
    };

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
    this._backgroundElement.className = 'simple-selector unselectable';
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

    this._containerElement.appendChild(contextWrapper);
    this._backgroundElement.appendChild(this._containerElement);
    document.body.appendChild(this._backgroundElement);
};
gui.DummyTransferLegSelector.prototype = Object.create(gui.OrbitingBodySelector.prototype);
gui.DummyTransferLegSelector.prototype.constructor = gui.DummyTransferLegSelector;

gui.DummyTransferLegSelector.prototype._confirmAndClose = function () {
    this.hide();
    this._orbitingBody.onConfigurationDone(true, this._configuration);
};

gui.DummyTransferLegSelector.prototype._update = function () {
    if (this._isEditable) {
        this._confirmAndClose();
    }
};

gui.DummyTransferLegSelector.prototype.show = function (editable) {
    this._isEditable = editable;
    this._backgroundElement.style.display = 'block';
    this._isVisible = true;
    if (!this._isEditable) {
        this._infoWrapper.style.display = 'flex';
    }
    utility.fitText();
};

gui.DummyTransferLegSelector.prototype.hide = function () {
    this._backgroundElement.style.display = 'none';
    this._isVisible = false;
    this._isEditable = false;
    this._orbitingBody.onConfigurationWindowOut();
};