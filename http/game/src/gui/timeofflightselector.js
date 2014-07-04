/* Class TimeOfFlightSelector 
    Provides the time of flight selection graphical user interface. 
    Inherits OrbitingBodySelector
*/
gui.TimeOfFlightSelector = function (orbitingBody) {
    gui.OrbitingBodySelector.call(this, orbitingBody);
    var self = this;
    this._configuration = {
        timeOfFlightBounds: [],
        radiusBounds: [],
        betaBounds: [-2 * Math.PI, 2 * Math.PI]
    };

    this._backgroundName = 'simpleselector';
    this._backgroundHeightFactorLR = 0.1;
    this._backgroundHeightFactorUD = 0.1;
    this._backgroundWidthFactorLR = 2.08;
    this._backgroundWidthFactorUD = 1.83;
    this._containerHeightFactor = 0.76;
    this._containerWidthFactor = 0.88;
    this._containerMarginFactorL = 0.12;
    this._containerMarginFactorT = 0.24;
    this._marginLR = 0.3e11;
    this._marginUD = 0.5e11;

    this._numOrbits = 5;
    this._maxTimeOfFlight = this._orbitingBody.getMaxTimeOfFlight() * utility.SEC_TO_DAY;

    var backgroundHeight = Math.round(window.innerHeight * this._backgroundHeightFactorUD);
    var backgroundWidth = Math.round(backgroundHeight * this._backgroundWidthFactorUD);

    this._backgroundElement = document.createElement('div');
    this._backgroundElement.id = 'background' + this._id;
    this._backgroundElement.className = 'timeofflight-selector unselectable';
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

    this._titleWrapper = document.createElement('div');
    this._titleWrapper.className = 'title-wrapper';

    var titleElement = document.createElement('div');
    titleElement.className = 'title';
    titleElement.textContent = this._orbitingBody.getName();

    this._titleWrapper.appendChild(titleElement);
    contextWrapper.appendChild(this._titleWrapper);

    this._toolBoxWrapper = document.createElement('div');
    this._toolBoxWrapper.className = 'toolbox-wrapper';

    var toolBoxCol = document.createElement('div');
    toolBoxCol.className = 'col1';

    var row = document.createElement('div');
    row.className = 'row1';

    var col = document.createElement('div');
    col.className = 'col1';
    var img = document.createElement('img');
    img.src = 'res/svg/clock.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    row.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';
    var wrapper = document.createElement('div');
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';

    var markerPositions = [];
    var orbitalPeriod = this._orbitingBody.getOrbitalPeriod() * utility.SEC_TO_DAY;
    for (var i = 1; i <= this._numOrbits; i++) {
        markerPositions.push(orbitalPeriod * i);
    }
    this._timeOfFlightRangeSlider = new gui.RangeSlider(wrapper, {
        rangeMarkerPositions: markerPositions
    });
    col.appendChild(wrapper);
    row.appendChild(col);

    toolBoxCol.appendChild(row);

    row = document.createElement('div');
    row.className = 'row2';

    col = document.createElement('div');
    col.className = 'col1';
    img = document.createElement('img');
    img.src = 'res/svg/radiusicon.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    row.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';
    wrapper = document.createElement('div');
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';
    this._radiusRangeSlider = new gui.RangeSlider(wrapper);
    col.appendChild(wrapper);
    row.appendChild(col);
    toolBoxCol.appendChild(row);

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'col2';

    var centerVertically = document.createElement('div');
    centerVertically.className = 'center-vertically center-horizontally';
    centerVertically.style.width = '90%';
    centerVertically.style.height = '70%';

    this._cancelElement = document.createElement('img');
    this._cancelElement.className = 'button';
    this._cancelElement.style.bottom = 0;
    this._cancelElement.src = 'res/svg/cancel.svg';
    this._cancelElement.onclick = function () {
        self._resetSelection();
        self._orbitingBody.onConfigurationDone(false);
    };
    centerVertically.appendChild(this._cancelElement);

    this._confirmElement = document.createElement('img');
    this._confirmElement.className = 'button';
    this._confirmElement.src = 'res/svg/confirm.svg';
    this._confirmElement.style.top = 0;
    this._confirmElement.disabled = false;
    this._confirmElement.onclick = function () {
        self._confirmAndClose();
    };
    centerVertically.appendChild(this._confirmElement);
    buttonContainer.appendChild(centerVertically);

    this._toolBoxWrapper.appendChild(toolBoxCol);
    this._toolBoxWrapper.appendChild(buttonContainer);
    contextWrapper.appendChild(this._toolBoxWrapper);
    this._containerElement.appendChild(contextWrapper);
    this._backgroundElement.appendChild(this._containerElement);
    document.body.appendChild(this._backgroundElement);
};
gui.TimeOfFlightSelector.prototype = Object.create(gui.OrbitingBodySelector.prototype);
gui.TimeOfFlightSelector.prototype.constructor = gui.TimeOfFlightSelector;

gui.TimeOfFlightSelector.prototype._updateSliders = function () {
    this._timeOfFlightRangeSlider.range(this._configuration.timeOfFlightBounds);
    this._radiusRangeSlider.range(this._configuration.radiusBounds);
};

gui.TimeOfFlightSelector.prototype._resetSelection = function () {
    this._configuration.timeOfFlightBounds = [1, this._maxTimeOfFlight];
    this._configuration.radiusBounds = [this._orbitingBody.getMinRadius() / this._orbitingBody.getRadius(), this._orbitingBody.getMaxRadius() / this._orbitingBody.getRadius()];
    this._updateSliders();
};

gui.TimeOfFlightSelector.prototype._onMove = function () {
    this._timeOfFlightRangeSlider.onMove();
    this._radiusRangeSlider.onMove();
};

gui.TimeOfFlightSelector.prototype._onResize = function () {
    this._timeOfFlightRangeSlider.onResize();
    this._radiusRangeSlider.onResize();
};

gui.TimeOfFlightSelector.prototype._confirmAndClose = function () {
    this._configuration.timeOfFlightBounds = [this._timeOfFlightRangeSlider.min(), this._timeOfFlightRangeSlider.max()];
    this._configuration.radiusBounds = [this._radiusRangeSlider.min(), this._radiusRangeSlider.max()];
    this.hide();
    this._orbitingBody.onConfigurationDone(true, this._configuration);
};

gui.TimeOfFlightSelector.prototype.show = function (editable) {
    this._editable = editable;

    this._backgroundElement.style.display = 'block';
    if (this._editable) {
        this._titleWrapper.style.display = 'none';
        this._toolBoxWrapper.style.display = 'block';
        this._timeOfFlightRangeSlider.show();
        this._radiusRangeSlider.show();
        this._resetSelection();
    } else {
        this._titleWrapper.style.display = 'flex';
        this._toolBoxWrapper.style.display = 'none';
        this._timeOfFlightRangeSlider.hide();
        this._radiusRangeSlider.hide();
    }
    this._isVisible = true;
    utility.fitText();
};

gui.TimeOfFlightSelector.prototype.hide = function () {
    this._backgroundElement.style.display = 'none';
    this._isVisible = false;
    this._orbitingBody.onConfigurationWindowOut();
};