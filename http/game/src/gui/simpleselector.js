/* Class SimpleSelector 
    Provides the flyby configuration graphical user interface. 
    Inherits OrbitingBodyHUD
*/
gui.SimpleSelector = function (orbitingBody) {
    gui.OrbitingBodyHUD.call(this, orbitingBody);
    var self = this;

    this._backgroundName = 'simpleselector';
    this._backgroundHeightFactorLR = 0.15;
    this._backgroundHeightFactorUD = 0.195;
    this._backgroundWidthFactorLR = 3.00;
    this._backgroundWidthFactorUD = 2.745;
    this._containerHeightFactor = 0.76;
    this._containerWidthFactor = 0.92;
    this._containerMarginFactorL = 0.08;
    this._containerMarginFactorT = 0.24;

    this._numOrbits = 5;
    this._maxTimeOfFlight = this._orbitingBody.getMaxTimeOfFlight() * utility.SEC_TO_DAY;
    this._maxLaunchDelay = this._orbitingBody.getMaxLaunchDelay() * utility.SEC_TO_DAY;
    this._epoch = 0;
    this._vehicle = null;

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

    this._toolBoxWrapper = document.createElement('div');
    this._toolBoxWrapper.className = 'content-wrapper';

    this._infoBar = document.createElement('div');
    this._infoBar.className = 'row1 text-fit';

    var toolRow = document.createElement('div');
    toolRow.className = 'row2';

    var imageCol = document.createElement('div');
    imageCol.className = 'col1';
    this._imageElement = document.createElement('img');
    this._imageElement.className = 'image center-vertically center-horizontally';
    imageCol.appendChild(this._imageElement);

    var toolBoxCol = document.createElement('div');
    toolBoxCol.className = 'col2';

    this._launchEpochRow = document.createElement('div');
    this._launchEpochRow.className = 'row1';

    var col = document.createElement('div');
    col.className = 'col1';
    var img = document.createElement('img');
    img.src = 'res/svg/calendaricon.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    this._launchEpochRow.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';
    var wrapper = document.createElement('div');
    wrapper.title = 'configure launch epoch range';
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';

    this._launchEpochRangeSlider = new gui.RangeSlider(wrapper);
    col.appendChild(wrapper);
    this._launchEpochRow.appendChild(col);
    toolBoxCol.appendChild(this._launchEpochRow);

    this._velocityRow = document.createElement('div');
    this._velocityRow.className = 'row2';

    var col = document.createElement('div');
    col.className = 'col1';
    var img = document.createElement('img');
    img.src = 'res/svg/deltavicon.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    this._velocityRow.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';
    wrapper = document.createElement('div');
    wrapper.title = 'configure velocity range';
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';

    this._velocityRangeSlider = new gui.RangeSlider(wrapper);
    col.appendChild(wrapper);
    this._velocityRow.appendChild(col);
    toolBoxCol.appendChild(this._velocityRow);

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
    wrapper = document.createElement('div');
    wrapper.title = 'configure relative flyby distance range';
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';

    this._radiusRangeSlider = new gui.RangeSlider(wrapper);
    col.appendChild(wrapper);
    this._radiusRow.appendChild(col);
    toolBoxCol.appendChild(this._radiusRow);

    this._angleRow = document.createElement('div');
    this._angleRow.className = 'row2';

    col = document.createElement('div');
    col.className = 'col1';
    img = document.createElement('img');
    img.src = 'res/svg/angleicon.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    this._angleRow.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';
    wrapper = document.createElement('div');
    wrapper.title = 'configure flyby angle range';
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';

    this._betaRangeSlider = new gui.RangeSlider(wrapper);
    col.appendChild(wrapper);
    this._angleRow.appendChild(col);
    toolBoxCol.appendChild(this._angleRow);

    var row = document.createElement('div');
    row.className = 'row3';

    col = document.createElement('div');
    col.className = 'col1';
    img = document.createElement('img');
    img.src = 'res/svg/clockicon.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    row.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';
    wrapper = document.createElement('div');
    wrapper.title = 'configure leg time of flight range';
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

    var buttonCol = document.createElement('div');
    buttonCol.className = 'col3';

    var centerVertically = document.createElement('div');
    centerVertically.className = 'center-vertically center-horizontally';
    centerVertically.style.width = '90%';
    centerVertically.style.height = '70%';

    this._cancelElement = document.createElement('img');
    this._cancelElement.title = 'abort configuration';
    this._cancelElement.className = 'button';
    this._cancelElement.style.bottom = 0;
    this._cancelElement.src = 'res/svg/cancel.svg';
    this._cancelElement.onclick = function () {
        self._resetSelection();
        self._orbitingBody.onConfigurationDone(false);
    };
    centerVertically.appendChild(this._cancelElement);

    this._confirmElement = document.createElement('img');
    this._confirmElement.title = 'confirm configuration';
    this._confirmElement.className = 'button';
    this._confirmElement.src = 'res/svg/confirm.svg';
    this._confirmElement.style.top = 0;
    this._confirmElement.disabled = false;
    this._confirmElement.onclick = function () {
        self._confirmAndClose();
    };
    centerVertically.appendChild(this._confirmElement);
    buttonCol.appendChild(centerVertically);

    toolRow.appendChild(imageCol);
    toolRow.appendChild(toolBoxCol);
    toolRow.appendChild(buttonCol);
    this._toolBoxWrapper.appendChild(this._infoBar);
    this._toolBoxWrapper.appendChild(toolRow);
    contextWrapper.appendChild(this._toolBoxWrapper);
    this._containerElement.appendChild(contextWrapper);
    this._backgroundElement.appendChild(this._containerElement);
    document.body.appendChild(this._backgroundElement);

    this._hideConfiguration();
};
gui.SimpleSelector.prototype = Object.create(gui.OrbitingBodyHUD.prototype);
gui.SimpleSelector.prototype.constructor = gui.SimpleSelector;

gui.SimpleSelector.prototype._showFlybyConfiguration = function () {
    this._toolBoxWrapper.style.display = 'block';
    this._radiusRow.style.display = 'block';
    this._angleRow.style.display = 'block';
    this._radiusRangeSlider.show();
    this._betaRangeSlider.show();
    this._timeOfFlightRangeSlider.show();
    this._resetSelection();
    this._infoBar.textContent = 'Configure flyby at ' + this._orbitingBody.getName() + '. Next ' + (this._userAction.nextLeg.performLanding ? 'landing' : 'flyby') + ' at ' + this._userAction.nextOrbitingBody.getName() + '.';
};

gui.SimpleSelector.prototype._showLaunchConfiguration = function () {
    this._toolBoxWrapper.style.display = 'block';
    this._launchEpochRow.style.display =  'block';
    this._velocityRow.style.display =  'block';
    this._launchEpochRangeSlider.show();
    this._timeOfFlightRangeSlider.show();
    this._velocityRangeSlider.show();
    this._resetSelection();
    this._infoBar.textContent = 'Configure launch from ' + this._orbitingBody.getName() + '. Next ' + (this._userAction.nextLeg.performLanding ? 'landing' : 'flyby') + ' at ' + this._userAction.nextOrbitingBody.getName() + '.';
};

gui.SimpleSelector.prototype._hideConfiguration = function () {
    this._launchEpochRangeSlider.hide();
    this._radiusRangeSlider.hide();
    this._betaRangeSlider.hide();
    this._timeOfFlightRangeSlider.hide();
    this._velocityRangeSlider.hide();
    this._toolBoxWrapper.style.display = 'none';
    this._launchEpochRow.style.display = 'none';
    this._radiusRow.style.display = 'none';
    this._angleRow.style.display = 'none';
    this._velocityRow.style.display = 'none';
};

gui.SimpleSelector.prototype._updateSliders = function () {
    if (this._vehicle.isLanded()) {
        this._launchEpochRangeSlider.range(this._userAction.nextLeg.launchEpochBounds);
        this._velocityRangeSlider.range(this._userAction.nextLeg.velocityBounds);
    } else {
        this._radiusRangeSlider.range(this._userAction.nextLeg.radiusBounds);
        this._betaRangeSlider.range(this._userAction.nextLeg.betaBounds);
    }
    this._timeOfFlightRangeSlider.range(this._userAction.nextLeg.timeOfFlightBounds);
};

gui.SimpleSelector.prototype._resetSelection = function () {
    if (this._vehicle.isLanded()) {
        delete this._userAction.nextLeg.radiusBounds;
        delete this._userAction.nextLeg.betaBounds;
        this._userAction.nextLeg.problemType = astrodynamics.ProblemTypes.MGA1DSM_LAUNCH;
        this._userAction.nextLeg.launchEpochBounds = [this._epoch, this._epoch + this._maxLaunchDelay];
        this._userAction.nextLeg.velocityBounds = [0, this._vehicle.getRemainingDeltaVForStage()];
    } else {
        delete this._userAction.nextLeg.launchEpochBounds;
        delete this._userAction.nextLeg.velocityBounds;
        this._userAction.nextLeg.problemType = astrodynamics.ProblemTypes.MGA1DSM_FLYBY;
        this._userAction.nextLeg.radiusBounds = [this._orbitingBody.getMinRadius() / this._orbitingBody.getRadius(), this._orbitingBody.getMaxRadius() / this._orbitingBody.getRadius()];
        this._userAction.nextLeg.betaBounds = [-2 * Math.PI, 2 * Math.PI];
    }
    this._userAction.nextLeg.timeOfFlightBounds = [1e-2, this._maxTimeOfFlight];
    this._updateSliders();
};

gui.SimpleSelector.prototype._onMove = function () {
    this._timeOfFlightRangeSlider.onMove();
    this._launchEpochRangeSlider.onMove();
    this._velocityRangeSlider.onMove();
    this._radiusRangeSlider.onMove();
    this._betaRangeSlider.onMove();
};

gui.SimpleSelector.prototype._onResize = function () {
    this._timeOfFlightRangeSlider.onResize();
    this._launchEpochRangeSlider.onResize();
    this._velocityRangeSlider.onResize();
    this._radiusRangeSlider.onResize();
    this._betaRangeSlider.onResize();
};

gui.SimpleSelector.prototype._confirmAndClose = function () {
    if (this._vehicle.isLanded()) {
        this._userAction.nextLeg.launchEpochBounds = [this._launchEpochRangeSlider.min(), this._launchEpochRangeSlider.max()];
        this._userAction.nextLeg.velocityBounds = [this._velocityRangeSlider.min(), this._velocityRangeSlider.max()];
    } else {
        this._userAction.nextLeg.radiusBounds = [this._radiusRangeSlider.min(), this._radiusRangeSlider.max()];
        this._userAction.nextLeg.betaBounds = [this._betaRangeSlider.min(), this._betaRangeSlider.max()];
    }
    this._userAction.nextLeg.timeOfFlightBounds = [this._timeOfFlightRangeSlider.min(), this._timeOfFlightRangeSlider.max()];
    this._orbitingBody.onConfigurationDone(true);
    this.hide();
};

gui.SimpleSelector.prototype.onActivated = function (epoch, vehicle) {
    this._epoch = epoch;
    this._vehicle = vehicle.clone();
    this._imageElement.src = this._vehicle.getStageImageURL();
    this._isActivated = true;
};

gui.SimpleSelector.prototype.onDeactivated = function () {
    this._epoch = 0;
    this._vehicle = null;
    this._imageElement.src = '';
    this._isActivated = false;
};

gui.SimpleSelector.prototype.show = function (userAction) {
    this._userAction = userAction;
    this._isEditable = this._userAction != null;

    this._backgroundElement.style.display = 'block';
    this._toolBoxWrapper.style.display = 'none';
    if (this._isEditable) {
        this._infoWrapper.style.display = 'none';
        if (this._vehicle.isLanded()) {
            this._showLaunchConfiguration();
        } else {
            this._showFlybyConfiguration();
        }
    } else {
        this._infoWrapper.style.display = 'flex';
    }
    this._isVisible = true;
    utility.fitText();
};

gui.SimpleSelector.prototype.hide = function () {
    this._orbitingBody.onConfigurationWindowOut();
    this._backgroundElement.style.display = 'none';
    this._hideConfiguration();
    this._infoBar.textContent = '';
    this._isVisible = false;
    this._isEditable = false;
};