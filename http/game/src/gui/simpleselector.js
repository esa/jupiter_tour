/* Class SimpleSelector 
    Provides the time of flight selection graphical user interface. 
    Inherits OrbitingBodySelector
*/
gui.SimpleSelector = function (orbitingBody) {
    gui.OrbitingBodySelector.call(this, orbitingBody);
    var self = this;

    this._configuration = {
        problemType: null
    };

    this._numOrbits = 5;

    this._maxTimeOfFlight = this._orbitingBody.getMaxTimeOfFlight() * utility.SEC_TO_DAY;
    this._maxLaunchDelay = this._orbitingBody.getMaxLaunchDelay() * utility.SEC_TO_DAY;
    this._epoch = 0;
    this._vehicle = null;

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

    this._launchEpochRow = document.createElement('div');
    this._launchEpochRow.className = 'row1';

    var col = document.createElement('div');
    col.className = 'col1';
    var img = document.createElement('img');
    img.src = 'res/svg/calendar.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    this._launchEpochRow.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';
    var wrapper = document.createElement('div');
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';

    this._launchEpochRangeSlider = new gui.RangeSlider(wrapper);
    col.appendChild(wrapper);
    this._launchEpochRow.appendChild(col);
    toolBoxCol.appendChild(this._launchEpochRow);

    this._radiusRow = document.createElement('div');
    this._radiusRow.className = 'row1';

    col = document.createElement('div');
    col.className = 'col1';
    img = document.createElement('img');
    img.src = 'res/svg/radiusicon.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    this._radiusRow.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';
    var wrapper = document.createElement('div');
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';

    this._radiusRangeSlider = new gui.RangeSlider(wrapper);
    col.appendChild(wrapper);
    this._radiusRow.appendChild(col);
    toolBoxCol.appendChild(this._radiusRow);

    var row = document.createElement('div');
    row.className = 'row2';

    col = document.createElement('div');
    col.className = 'col1';
    img = document.createElement('img');
    img.src = 'res/svg/clock.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    row.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';
    wrapper = document.createElement('div');
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
gui.SimpleSelector.prototype = Object.create(gui.OrbitingBodySelector.prototype);
gui.SimpleSelector.prototype.constructor = gui.SimpleSelector;

gui.SimpleSelector.prototype._updateSliders = function () {
    if (this._vehicle.isLanded()) {
        this._launchEpochRangeSlider.range(this._configuration.launchEpochBounds);
    } else {
        this._radiusRangeSlider.range(this._configuration.radiusBounds);
    }
    this._timeOfFlightRangeSlider.range(this._configuration.timeOfFlightBounds);
};

gui.SimpleSelector.prototype._resetSelection = function () {
    if (this._vehicle.isLanded()) {
        delete this._configuration.radiusBounds;
        delete this._configuration.betaBounds;
        this._configuration.problemType = astrodynamics.ProblemTypes.MGA1DSM;
        this._configuration.launchEpochBounds = [this._epoch, this._epoch + this._maxLaunchDelay];
        this._configuration.velocityBounds = [0, this._vehicle.getDeltaV()];
    } else {
        delete this._configuration.launchEpochBounds;
        delete this._configuration.velocityBounds;
        this._configuration.problemType = astrodynamics.ProblemTypes.MGAPART;
        this._configuration.radiusBounds = [this._orbitingBody.getMinRadius() / this._orbitingBody.getRadius(), this._orbitingBody.getMaxRadius() / this._orbitingBody.getRadius()];
        this._configuration.betaBounds = [-2 * Math.PI, 2 * Math.PI];
    }
    this._configuration.timeOfFlightBounds = [1, this._maxTimeOfFlight];
    this._updateSliders();
};

gui.SimpleSelector.prototype._onMove = function () {
    this._timeOfFlightRangeSlider.onMove();
    this._launchEpochRangeSlider.onMove();
    this._radiusRangeSlider.onMove();
};

gui.SimpleSelector.prototype._onResize = function () {
    this._timeOfFlightRangeSlider.onResize();
    this._launchEpochRangeSlider.onResize();
    this._radiusRangeSlider.onResize();
};

gui.SimpleSelector.prototype._confirmAndClose = function () {
    if (this._vehicle.isLanded()) {
        this._configuration.launchEpochBounds = [this._launchEpochRangeSlider.min(), this._launchEpochRangeSlider.max()];
    } else {
        this._configuration.radiusBounds = [this._radiusRangeSlider.min(), this._radiusRangeSlider.max()];
    }
    this._configuration.timeOfFlightBounds = [this._timeOfFlightRangeSlider.min(), this._timeOfFlightRangeSlider.max()];
    this.hide();
    this._orbitingBody.onConfigurationDone(true, this._configuration);
};

gui.SimpleSelector.prototype.onActivated = function (epoch, vehicle) {
    this._epoch = epoch;
    this._vehicle = vehicle.clone();
};

gui.SimpleSelector.prototype.onDeactivated = function () {
    this._epoch = 0;
    this._vehicle =  null;
};

gui.SimpleSelector.prototype.show = function (editable) {
    this._editable = editable;

    this._backgroundElement.style.display = 'block';
    if (this._editable) {
        this._titleWrapper.style.display = 'none';
        this._toolBoxWrapper.style.display = 'block';
        if (this._vehicle.isLanded()) {
            this._launchEpochRow.style.display =  'block';
            this._launchEpochRangeSlider.show();
        } else {
            this._radiusRow.style.display = 'block';
            this._radiusRangeSlider.show();
        }
        this._timeOfFlightRangeSlider.show();
        this._resetSelection();
    } else {
        this._titleWrapper.style.display = 'flex';
        this._launchEpochRangeSlider.hide();
        this._radiusRangeSlider.hide();
        this._timeOfFlightRangeSlider.hide();
        this._toolBoxWrapper.style.display = 'none';
        this._launchEpochRow.style.display = 'none';
        this._radiusRow.style.display = 'none';
    }
    this._isVisible = true;
    utility.fitText();
};

gui.SimpleSelector.prototype.hide = function () {
    this._backgroundElement.style.display = 'none';
    this._isVisible = false;
    this._orbitingBody.onConfigurationWindowOut();
};