/* Class TransferLegFaceSelector
    Interface for selecting the transferleg arrival condition for a FaceSelector orbiting body.
*/
gui.TransferLegFaceSelector = function (orbitingBody) {
    gui.OrbitingBodyHUD.call(this, orbitingBody);
    var self = this;

    this._backgroundName = 'faceselector';
    this._backgroundHeightFactorLR = 0.25;
    this._backgroundHeightFactorUD = 0.33;
    this._backgroundWidthFactorLR = 2.04;
    this._backgroundWidthFactorUD = 1.34;
    this._containerHeightFactor = 0.77;
    this._containerMarginFactorL = 0.15;
    this._containerMarginFactorT = 0.23;
    this._containerWidthFactor = 0.85;

    this._arrivalOption = this._orbitingBody.getArrivalOption();

    this._currentMapViewID = 0;
    this._jupiterRadius = 10;
    this._visitRadius = 3;

    var backgroundHeight = Math.round(window.innerHeight * this._backgroundHeightFactorUD);
    var backgroundWidth = Math.round(backgroundHeight * this._backgroundWidthFactorUD);

    this._backgroundElement = document.createElement('div');
    this._backgroundElement.className = 'transfer-leg-face-selector unselectable';
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

    var rowElement1 = document.createElement('div');
    rowElement1.className = 'row1';

    var titleContainer = document.createElement('div');
    titleContainer.className = 'col1';

    var titleElement = document.createElement('div');
    titleElement.className = 'title text-fit';
    titleElement.textContent = this._orbitingBody.getName();

    titleContainer.appendChild(titleElement);
    rowElement1.appendChild(titleContainer);

    this._containerElement.appendChild(rowElement1);

    var contextWrapper = document.createElement('div');
    contextWrapper.className = 'context-wrapper';

    this._infoWrapper = document.createElement('div');
    this._infoWrapper.className = 'info-wrapper';

    this._questionBoxWrapper = document.createElement('div');
    this._questionBoxWrapper.className = 'question-wrapper';

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

    this._infoWrapper.appendChild(rowElement2);

    var rowElement3 = document.createElement('div');
    rowElement3.className = 'row3';

    var rowDiv = document.createElement('div');
    rowDiv.className = 'col1';

    this._mapElement = document.createElement('div');
    this._mapElement.className = 'map-container';

    rowDiv.appendChild(this._mapElement);

    rowElement3.appendChild(rowDiv);

    this._infoWrapper.appendChild(rowElement3);
    contextWrapper.appendChild(this._infoWrapper);
    this._containerElement.appendChild(contextWrapper);
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
        .style('cursor', 'pointer');

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
};
gui.TransferLegFaceSelector.prototype = Object.create(gui.OrbitingBodyHUD.prototype);
gui.TransferLegFaceSelector.prototype.constructor = gui.TransferLegFaceSelector;

gui.TransferLegFaceSelector.prototype._onResize = function (event) {
    this._setMapProjection(this._currentMapViewID);
};

gui.TransferLegFaceSelector.prototype._getFaceColor = function (faceID) {
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

gui.TransferLegFaceSelector.prototype._updateMapElements = function () {
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

gui.TransferLegFaceSelector.prototype._updateMap = function () {
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

gui.TransferLegFaceSelector.prototype._setMapProjection = function (id) {
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

gui.TransferLegFaceSelector.prototype._onMapDrag = function (event) {
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

gui.TransferLegFaceSelector.prototype._confirmAndClose = function () {
    this._orbitingBody.onConfigurationDone(true);
    this.hide();
};

gui.TransferLegFaceSelector.prototype._resetSelection = function () {
    switch (this._arrivalOption) {
    case core.VehicleArrivalOptions.PERFORM_FLYBY:
    case core.VehicleArrivalOptions.DEFAULT_IS_FLYBY:
        this._userAction.nextLeg.performLanding = false;
        break;

    case core.VehicleArrivalOptions.PERFORM_LANDING:
    case core.VehicleArrivalOptions.DEFAULT_IS_LANDING:
        this._userAction.nextLeg.performLanding = true;
        break;
    }
};

gui.TransferLegFaceSelector.prototype._update = function () {
    if (this._isEditable && (this._arrivalOption == core.VehicleArrivalOptions.PERFORM_LANDING || this._arrivalOption == core.VehicleArrivalOptions.PERFORM_FLYBY)) {
        this._resetSelection();
        this._confirmAndClose();
    }
};

gui.TransferLegFaceSelector.prototype.show = function (userAction) {
    this._userAction = userAction;
    this._isEditable = this._userAction != null;

    this._backgroundElement.style.display = 'block';
    this._updateMap();
    if (this._isEditable) {
        this._infoWrapper.style.display =  'none';
        this._questionBoxWrapper.style.display = 'block';
    } else {
        this._questionBoxWrapper.style.display = 'none';
        this._infoWrapper.style.display = 'block';
    }
    this._isVisible = true;
    utility.fitText();
};

gui.TransferLegFaceSelector.prototype.hide = function () {
    this._orbitingBody.onConfigurationWindowOut();
    this._backgroundElement.style.display = 'none';
    this._isVisible = false;
    this._isEditable = false;
};