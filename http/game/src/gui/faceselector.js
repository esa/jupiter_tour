/* Class FaceSelector 
    Provides the face selection graphical user interface. 
    Inherits OrbitingBodySelector
*/
gui.FaceSelector = function (orbitingBody) {
    gui.OrbitingBodySelector.call(this, orbitingBody);
    var self = this;

    this._backgroundName = 'faceselector';
    this._backgroundHeightFactorLR = 1 / 3.9;
    this._backgroundHeightFactorUD = 1 / 3;
    this._backgroundWidthFactorLR = 1 / 9 * 18.4;
    this._backgroundWidthFactorUD = 1 / 9 * 12.1;
    this._containerHeightFactor = 0.77;
    this._containerMarginFactorL = 0.15;
    this._containerMarginFactorT = 0.23;
    this._containerWidthFactor = 0.85;

    this._numOrbits = 5;
    this._maxTimeOfFlight = this._orbitingBody.getMaxTimeOfFlight() * utility.SEC_TO_DAY;

    this._betaRadiusBoundsEnabled = false;
    this._currentMapViewID = 0;
    this._jupiterRadius = 10;
    this._visitRadius = 3;

    var backgroundHeight = Math.round(window.innerHeight * this._backgroundHeightFactorUD);
    var backgroundWidth = Math.round(backgroundHeight * this._backgroundWidthFactorUD);

    this._backgroundElement = document.createElement('div');
    this._backgroundElement.className = 'face-selector unselectable';
    this._backgroundElement.style.width = utility.toPixelString(backgroundWidth);
    this._backgroundElement.style.height = utility.toPixelString(backgroundHeight);
    this._backgroundElement.style.backgroundImage = 'url(res/svg/' + this._backgroundName + 'viewup.svg)';
    this._backgroundElement.style.display = 'none';
    this._backgroundElement.oncontextmenu = function () {
        return false;
    };

    this._containerElement = document.createElement('div');
    this._containerElement.className = 'container';
    this._containerElement.style.width = '100%';
    this._containerElement.style.height = utility.toPixelString(backgroundHeight * this._containerHeightFactor);

    var rowElement1 = document.createElement('div');
    rowElement1.className = 'row1';

    var titleContainer = document.createElement('div');
    titleContainer.className = 'col1';

    var titleElement = document.createElement('div');
    titleElement.className = 'title text-fit';
    titleElement.textContent = this._orbitingBody.getName();

    titleContainer.appendChild(titleElement);
    rowElement1.appendChild(titleContainer);

    var col = document.createElement('div');
    col.className = 'col2';
    var img = document.createElement('img');
    img.src = 'res/svg/clockicon.svg';
    img.className = 'icon center-horizontally center-vertically';
    col.appendChild(img);
    rowElement1.appendChild(col);
    this._clockIcon = img;

    col = document.createElement('div');
    col.className = 'col3';
    var wrapper = document.createElement('div');
    wrapper.title = 'configure leg time of flight range';
    wrapper.className = 'rangeslider-wrapper center-vertically';
    var markerPositions = [];
    var orbitalPeriod = this._orbitingBody.getOrbitalPeriod() * utility.SEC_TO_DAY;
    for (var i = 1; i <= this._numOrbits; i++) {
        markerPositions.push(orbitalPeriod * i);
    }
    this._timeOfFlightRangeSlider = new gui.RangeSlider(wrapper, {
        rangeMarkerPositions: markerPositions
    });
    col.appendChild(wrapper);
    rowElement1.appendChild(col);

    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'col4';

    var centerVertically = document.createElement('div');
    centerVertically.className = 'center-vertically';
    centerVertically.style.width = '100%';
    centerVertically.style.height = '80%';

    this._cancelElement = document.createElement('img');
    this._cancelElement.title = 'abort configuration';
    this._cancelElement.className = 'button';
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
    this._confirmElement.style.display = 'none';
    this._confirmElement.style.marginRight = '10%';
    this._confirmElement.disabled = false;
    this._confirmElement.onclick = function () {
        self._confirmAndClose();
    };
    centerVertically.appendChild(this._confirmElement);

    buttonContainer.appendChild(centerVertically);

    rowElement1.appendChild(buttonContainer);
    this._containerElement.appendChild(rowElement1);

    var rowElement2 = document.createElement('div');
    rowElement2.className = 'row2';
    col = document.createElement('div');
    col.className = 'col1';

    this._selector = document.createElement('select');
    this._selector.title = 'select surface projection';
    this._selector.className = 'center-vertically text-fit';
    this._selector.id = 'select' + this._id;
    this._selector.innerHTML = '<option value="0">mercator</option> \
          <option value="1">cylindrical equal-area</option> \
          <option value="2">equirectangular</option> \
          <option value="3">sinusoidal</option> \
          <option value="4">orthographic</option>';
    col.appendChild(this._selector);
    rowElement2.appendChild(col);

    col = document.createElement('div');
    col.className = 'col2';

    img = document.createElement('img');
    img.title = 'toggle beta and radius range';
    img.className = 'button-icon center-horizontally center-vertically';
    img.src = 'res/svg/angleicon.svg';
    img.style.visibility = 'hidden';
    img.onclick = function () {
        if (self._userAction.faceID == gui.NULL_ID) {
            self._setBetaRadiusBoundsEnabled(!self._betaRadiusBoundsEnabled);
        }
    };
    col.appendChild(img);
    rowElement2.appendChild(col);
    this._angleIcon = img;

    col = document.createElement('div');
    col.className = 'col3';
    wrapper = document.createElement('div');
    wrapper.title = 'configure flyby angle range';
    wrapper.className = 'rangeslider-wrapper center-vertically';
    this._betaRangeSlider = new gui.RangeSlider(wrapper);
    col.appendChild(wrapper);
    rowElement2.appendChild(col);

    col = document.createElement('div');
    col.className = 'col4';
    img = document.createElement('img');
    img.title = 'toggle beta and radius range';
    img.src = 'res/svg/radiusicon.svg';
    img.className = 'button-icon center-horizontally center-vertically';
    img.style.visibility = 'hidden';
    img.onclick = function () {
        if (self._userAction.faceID == gui.NULL_ID) {
            self._setBetaRadiusBoundsEnabled(!self._betaRadiusBoundsEnabled);
        }
    };
    col.appendChild(img);
    rowElement2.appendChild(col);
    this._radiusIcon = img;


    col = document.createElement('div');
    col.className = 'col5';
    wrapper = document.createElement('div');
    wrapper.title = 'configure relative flyby distance range';
    wrapper.className = 'rangeslider-wrapper center-vertically';
    this._radiusRangeSlider = new gui.RangeSlider(wrapper);
    col.appendChild(wrapper);
    rowElement2.appendChild(col);

    this._containerElement.appendChild(rowElement2);

    var rowElement3 = document.createElement('div');
    rowElement3.className = 'row3';

    var rowDiv = document.createElement('div');
    rowDiv.className = 'col1';

    this._mapElement = document.createElement('div');
    this._mapElement.className = 'map-container';

    rowDiv.appendChild(this._mapElement);

    rowElement3.appendChild(rowDiv);

    this._containerElement.appendChild(rowElement3);
    this._backgroundElement.appendChild(this._containerElement);
    document.body.appendChild(this._backgroundElement);

    this._projections = [d3.geo.mercator().scale(60),
 d3.geo.cylindricalEqualArea().scale(130),
 d3.geo.equirectangular().scale(120),
 d3.geo.sinusoidal().scale(95),
 d3.geo.orthographic().clipAngle(90)
    ];

    this._svgElement = d3.select(this._mapElement).append('svg');
    this._svgElement.attr('id', 'mapsvg' + this._id);
    this._svgElement.attr('width', '100%');
    this._svgElement.attr('height', '100%');
    this._svgElement.attr('viewBox', '300,100,365,300');
    this._svgElement.style('pointer-Events', 'all');
    this._svgElement.style('overflow', 'hidden');

    var mouseDriver = new utility.MouseDriver(this._svgElement[0][0]);
    mouseDriver.registerRightDrag(function (event) {
        self._onMapDrag(event);
    });

    this._setMapProjection(this._currentMapViewID);
    this._path = d3.geo.path().projection(this._currentProjection);

    $(this._selector).on('change', function (event) {
        self._orbitingBody.onConfigurationWindowOver();
        self._setMapProjection(parseInt(this.value));
    });
    $(this._selector).value = this._currentMapViewID;

    var surface = this._orbitingBody.getD3Surface();
    var faceClicked = false;
    var clickTimeoutID = 0;
    this._svgElement.selectAll('path.polygon')
        .data(surface.features)
        .enter()
        .append('path')
        .style('stroke', '#19A3FF')
        .attr('d', this._path)
        .attr('class', 'polygon')
        .style('fill', 'none')
        .style('cursor', 'pointer')
        .on('click', function (d3Face) {
            if (faceClicked) {
                clearTimeout(clickTimeoutID);
                self._onDblClick(d3Face);
                faceClicked = false;
            } else {
                faceClicked = true;
                clickTimeoutID = setTimeout(function () {
                    self._onClick(d3Face);
                    faceClicked = false;
                }, 200);
            }
        });

    this._svgElement.selectAll('text')
        .data(surface.features)
        .enter()
        .append('svg:text')
        .text(function (d3Face) {
            return d3Face.properties.faceValue;
        })
        .attr('x', function (d3Face) {
            return self._path.centroid(d3Face)[0];
        })
        .attr('y', function (d3Face) {
            return self._path.centroid(d3Face)[1];
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '25')
        .attr('fill', '#ffffff')
        .style('pointer-Events', 'none');

    this._svgElement.selectAll('path.jupiter')
        .data([{
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [180, 0],
            },
        }])
        .enter()
        .append('path')
        .attr('d', this._path.pointRadius(this._jupiterRadius))
        .attr('class', 'jupiter')
        .style('pointer-Events', 'none')
        .style('fill', '#f9ecb6');

    this._backgroundElement.style.left = utility.toPixelString(this._screenPosition.getX() - $(this._backgroundElement).outerWidth() / 2, true);
    this._backgroundElement.style.top = utility.toPixelString(this._screenPosition.getY() - $(this._backgroundElement).outerHeight() - this._orbitingBody.getRadius() * gui.POSITION_SCALE, true);

    this._setBetaRadiusBoundsEnabled(this._betaRadiusBoundsEnabled);
};
gui.FaceSelector.prototype = Object.create(gui.OrbitingBodySelector.prototype);
gui.FaceSelector.prototype.constructor = gui.FaceSelector;

gui.FaceSelector.prototype._onClick = function (d3Face) {
    var self = this;
    if (this._isEditable) {
        var faceID = d3Face.id;
        if (this._userAction.faceID != gui.NULL_ID) {
            if (this._userAction.faceID == faceID) {
                this._resetSelection();
            } else {
                if (this._orbitingBody.isFaceVisitable(faceID)) {
                    this._setSelection(faceID);
                }
            }
        } else {
            if (this._orbitingBody.isFaceVisitable(faceID)) {
                this._setSelection(faceID);
            }
        }

        this._svgElement.selectAll('path.polygon').style('fill', function (d3Face) {
            return self._getFaceColor(d3Face.id);
        });
    }
};

gui.FaceSelector.prototype._onDblClick = function (d3Face) {
    var self = this;
    if (this._isEditable && this._orbitingBody.isFaceVisitable(d3Face.id)) {
        this._setSelection(d3Face.id);
        this._confirmAndClose();
    }
};

gui.FaceSelector.prototype._setBetaRadiusBoundsEnabled = function (enabled) {
    this._betaRadiusBoundsEnabled = enabled;
    this._updateSliders();
};

gui.FaceSelector.prototype._getFaceColor = function (faceID) {
    if (this._orbitingBody.isFaceSelected(faceID)) {
        return '#19A3FF';
    } else {
        if (this._orbitingBody.isFaceVisitable(faceID)) {
            return '#aaaaaa';
        } else {
            if (this._orbitingBody.isFaceVisited(faceID)) {
                return '#ffffff';
            } else {
                return '#000000';
            }
        }
    }
};

gui.FaceSelector.prototype._confirmAndClose = function () {
    if (this._betaRadiusBoundsEnabled) {
        this._userAction.nextLeg.betaBounds = [this._betaRangeSlider.min(), this._betaRangeSlider.max()];
        this._userAction.nextLeg.radiusBounds = [this._radiusRangeSlider.min(), this._radiusRangeSlider.max()];
    } else {
        this._userAction.nextLeg.betaBounds = [-2 * Math.PI, 2 * Math.PI];
        this._userAction.nextLeg.radiusBounds = [this._orbitingBody.getMinRadius() / this._orbitingBody.getRadius(), this._orbitingBody.getMaxRadius() / this._orbitingBody.getRadius()];
    }
    this._userAction.nextLeg.timeOfFlightBounds = [this._timeOfFlightRangeSlider.min(), this._timeOfFlightRangeSlider.max()];
    this.hide();
    this._orbitingBody.onConfigurationDone(true);
};

gui.FaceSelector.prototype._setSelection = function (faceID) {
    if (this._userAction.faceID != gui.NULL_ID) {
        this._orbitingBody.setFaceSelected(this._userAction.faceID, false);
    }
    this._userAction.faceID = faceID;
    this._userAction.nextLeg.betaBounds = this._orbitingBody.getFaceBetaBounds(faceID);
    this._userAction.nextLeg.radiusBounds = this._orbitingBody.getFaceRadiusBounds(faceID);
    this._userAction.nextLeg.timeOfFlightBounds = [1, this._maxTimeOfFlight];
    this._orbitingBody.setFaceSelected(this._userAction.faceID, true);
    this._betaRadiusBoundsEnabled = true;
    this._updateSliders();
};

gui.FaceSelector.prototype._resetSelection = function () {
    this._userAction.nextLeg;
    this._userAction.nextLeg.problemType = astrodynamics.ProblemTypes.MGA1DSM_FLYBY;

    if (this._userAction.faceID != gui.NULL_ID) {
        this._orbitingBody.setFaceSelected(this._userAction.faceID, false);
    }
    this._userAction.faceID = gui.NULL_ID;
    this._userAction.nextLeg.betaBounds = [-2 * Math.PI, 2 * Math.PI];
    this._userAction.nextLeg.radiusBounds = [this._orbitingBody.getMinRadius() / this._orbitingBody.getRadius(), this._orbitingBody.getMaxRadius() / this._orbitingBody.getRadius()];
    this._userAction.nextLeg.timeOfFlightBounds = [1e-2, this._maxTimeOfFlight];
    this._updateSliders();
};

gui.FaceSelector.prototype._onMove = function () {
    this._timeOfFlightRangeSlider.onMove();
    this._betaRangeSlider.onMove();
    this._radiusRangeSlider.onMove();
};

gui.FaceSelector.prototype._onMapDrag = function (event) {
    var rot = this._currentProjection.rotate();
    if (this._currentMapViewID == 4) {
        var theta = Math.max(-75, Math.min(75, rot[1] - event.deltaY / 4));
        this._currentProjection.rotate([rot[0] + event.deltaX / 4, theta]);
        this._path = d3.geo.path().projection(this._currentProjection);
        this._svgElement.selectAll('path').attr('d', this._path);
    } else {
        this._currentProjection.rotate([rot[0] + event.deltaX / 4, -0.01]);
        this._path = d3.geo.path().projection(this._currentProjection);
        this._svgElement.selectAll('path').attr('d', this._path);
        this._currentProjection.rotate([rot[0] + event.deltaX / 4, +0.01]);
        this._path = d3.geo.path().projection(this._currentProjection);
        this._svgElement.selectAll('path').attr('d', this._path);
    }
    this._updateMapElements();
};

gui.FaceSelector.prototype._updateSliders = function () {
    if (this._isEditable) {
        this._betaRangeSlider.range(this._userAction.nextLeg.betaBounds);
        this._radiusRangeSlider.range(this._userAction.nextLeg.radiusBounds);
        this._timeOfFlightRangeSlider.range(this._userAction.nextLeg.timeOfFlightBounds);

        if (this._betaRadiusBoundsEnabled) {
            this._betaRangeSlider.enable();
            this._radiusRangeSlider.enable();
        } else {
            this._betaRangeSlider.disable();
            this._radiusRangeSlider.disable();
        }
    }
};

gui.FaceSelector.prototype._updateMapElements = function () {
    var self = this;
    this._svgElement.selectAll('path.jupiter').attr('d', this._path.pointRadius(this._jupiterRadius));
    this._svgElement.selectAll('path.visit').attr('d', this._path.pointRadius(this._visitRadius));
    this._svgElement.selectAll('text').each(function (d3Face) {
        if (d3Face.properties.faceValue) {
            d3.select(this).style('display', 'block');
            var bounds = self._path.bounds(d3Face);
            var pos = self._path.centroid(d3Face);
            d3.select(this).attr('x', pos[0]);
            d3.select(this).attr('y', pos[1]);

            // TODO: Not very happy with this solution...
            if (bounds[1][0] - bounds[0][0] < 200) {
                d3.select(this).attr('fill', '#ffffff');
            } else {
                d3.select(this).attr('fill', 'transparent');
            }
        } else {
            d3.select(this).style('display', 'none');
        }
    });
};

gui.FaceSelector.prototype._updateMap = function () {
    var self = this;

    var surface = this._orbitingBody.getD3Surface();
    //TODO: There's a bug where the text is not in the correct position.
    // Update 26.6.2014: Not sure if the bug still exists...
    this._svgElement.selectAll('text').data(surface.features).text(function (d3Face) {
        return d3Face.properties.faceValue;
    });

    var visits = this._orbitingBody.getD3Visits();
    this._svgElement.selectAll('path.visit').remove();
    this._svgElement.selectAll('path.visit')
        .data(visits.features)
        .enter()
        .append('path')
        .style('fill', function (d3Visit) {
            if (d3Visit.properties.isNewest) {
                return '#19A3FF';
            } else {
                return '#000000';
            }
        })
        .style('pointer-Events', 'none')
        .attr('class', 'visit')
        .attr('d', this._path.pointRadius(this._visitRadius));

    this._svgElement.selectAll('path.polygon').attr('d', this._path).style('fill', function (d3Face) {
        return self._getFaceColor(d3Face.id);
    });
    this._updateMapElements();
};

gui.FaceSelector.prototype._setMapProjection = function (id) {
    // Necessary hack function. Otherwise the map svg has some strange artifacts...
    this._currentMapViewID = id;

    this._currentProjection = this._projections[id];
    this._currentProjection.rotate([-0.1, -0.1]);
    this._path = d3.geo.path().projection(this._currentProjection);
    this._svgElement.selectAll('path').attr('d', this._path);
    this._currentProjection.rotate([180.1, 0.1]);
    this._path = d3.geo.path().projection(this._currentProjection);
    this._svgElement.selectAll('path').attr('d', this._path);

    this._updateMapElements();
};

gui.FaceSelector.prototype._onResize = function (event) {
    this._setMapProjection(this._currentMapViewID);
    this._timeOfFlightRangeSlider.onResize();
    this._betaRangeSlider.onResize();
    this._radiusRangeSlider.onResize();
};

gui.FaceSelector.prototype.show = function (userAction) {
    this._userAction = userAction;
    this._isEditable = this._userAction != null;

    this._updateMap();
    this._confirmElement.style.display = 'none';
    this._backgroundElement.style.display = 'block';
    if (this._isEditable) {
        this._cancelElement.style.display = 'inline-block';
        this._confirmElement.style.display = 'inline-block';
        this._angleIcon.style.visibility = 'visible';
        this._radiusIcon.style.visibility = 'visible';
        this._clockIcon.style.visibility = 'visible';
        this._betaRangeSlider.show();
        this._radiusRangeSlider.show();
        this._timeOfFlightRangeSlider.show();
        this._resetSelection();
    } else {
        this._cancelElement.style.display = 'none';
        this._angleIcon.style.visibility = 'hidden';
        this._radiusIcon.style.visibility = 'hidden';
        this._clockIcon.style.visibility = 'hidden';
        this._timeOfFlightRangeSlider.hide();
        this._betaRangeSlider.hide();
        this._radiusRangeSlider.hide();
    }
    this._isVisible = true;
    utility.fitText();
};

gui.FaceSelector.prototype.hide = function () {
    this._backgroundElement.style.display = 'none';
    this._isVisible = false;
    this._isEditable = false;
    this._orbitingBody.onConfigurationWindowOut();
};