/* Class Rangeslider 
    Requires jQuery.
*/
gui.RangeSlider = function (domElement, params) {
    var self = this;
    this._domElement = domElement;
    this._container = document.createElement('div');
    this._container.className = 'rangeslider-container';
    this._bar = document.createElement('div');
    this._bar.className = 'rangeslider-bar';
    this._handle1 = document.createElement('div');
    this._handle1.className = 'rangeslider-handle';
    this._handle2 = document.createElement('div');
    this._handle2.className = 'rangeslider-handle';
    this._label1 = document.createElement('div');
    var text = document.createElement('p');
    this._label1.appendChild(text);
    this._label1.className = 'rangeslider-label';
    this._label2 = document.createElement('div');
    text = document.createElement('p');
    this._label2.appendChild(text);
    this._label2.className = 'rangeslider-label';

    this._container.appendChild(this._bar);
    this._container.appendChild(this._handle1);
    this._container.appendChild(this._handle2);
    this._container.appendChild(this._label1);
    this._container.appendChild(this._label2);

    this._domElement.appendChild(this._container);

    this._val1 = 0;
    this._val2 = 1;
    this._range = [0, 0];
    this._handlePercentage = 10;
    this._labelPercentage = 40;
    this._paddingPercentage = 5;
    this._width = $(this._domElement).width();
    this._left = $(this._domElement).offset().left;
    this._handleWidth = this._width / 100 * this._handlePercentage;
    this._labelWidth = this._width / 100 * this._labelPercentage;
    this._paddingWidth = this._width / 100 * this._paddingPercentage;

    this._rangeMarkerStep = 0;
    this._rangeMarkers = [];
    this._rangeMarkerPositions = [];
    if (params && params.rangeMarkerPositions) {
        this._rangeMarkerPositions = params.rangeMarkerPositions.clone();
        for (var i = 0; i < this._rangeMarkerPositions.length; i++) {
            var rangeMarker = document.createElement('div');
            rangeMarker.className = 'rangeslider-marker';
            this._container.appendChild(rangeMarker);
            this._rangeMarkers.push(rangeMarker);
        }
    }

    var mouseDriver = new utility.MouseDriver(this._bar);
    mouseDriver.registerLeftUp(function () {
        if ($(self._domElement).is(':visible')) {
            $('html,body').css('cursor', 'default');
            self._hideLabels();
        }
    });
    mouseDriver.registerLeftDown(function () {
        if (($(self._domElement).is(':visible'))) {
            $('html,body').css('cursor', 'ew-resize');
            self._showLabels();
        }
    });
    mouseDriver.registerLeftDblClick(this._zoomIn);
    mouseDriver.registerRightDblClick(this._zoomOut);
    mouseDriver.registerLeftDrag(function (event) {
        if ($(self._domElement).is(':visible')) {
            $('html,body').css('cursor', 'ew-resize');
            self._val1 = Math.min(1, Math.max(0, self._val1 + event.deltaX / (self._width - self._handleWidth)));
            self._val2 = Math.min(1, Math.max(0, self._val2 + event.deltaX / (self._width - self._handleWidth)));
            self._update();
            self._showLabels();
        }
    });

    mouseDriver = new utility.MouseDriver(this._handle1);
    mouseDriver.registerLeftDown(function () {
        if ($(self._domElement).is(':visible')) {
            $('html,body').css('cursor', 'ew-resize');
            self._showLabels();
        }
    });
    mouseDriver.registerLeftDrag(function (event) {
        if ($(self._domElement).is(':visible')) {
            $('html,body').css('cursor', 'ew-resize');
            self._val1 = Math.min(1, Math.max(0, self._val1 + event.deltaX / (self._width - self._handleWidth)));
            self._update();
            self._showLabels();
        }
    });

    mouseDriver = new utility.MouseDriver(this._handle2);
    mouseDriver.registerLeftDown(function () {
        if ($(self._domElement).is(':visible')) {
            $('html,body').css('cursor', 'ew-resize');
            self._showLabels();
        }
    });
    mouseDriver.registerLeftDrag(function (event) {
        if ($(self._domElement).is(':visible')) {
            $('html,body').css('cursor', 'ew-resize');
            self._val2 = Math.min(1, Math.max(0, self._val2 + event.deltaX / (self._width - self._handleWidth)));
            self._update();
            self._showLabels();
        }
    });
    this._update();
};
gui.RangeSlider.prototype = {
    constructor: gui.RangeSlider,

    _zoomIn: function (event) {
        console.log('Zoom in!');
        //TODO
    },

    _zoomOut: function (event) {
        console.log('Zoom out!');
        //TODO
    },

    _update: function () {
        $(this._handle1).css('width', this._handleWidth);
        $(this._handle2).css('width', this._handleWidth);
        $(this._handle1).css('left', this._val1 * this._width - this._handleWidth / 2);
        $(this._handle2).css('left', this._val2 * this._width - this._handleWidth / 2);

        var min = Math.min(this._val1, this._val2);
        var max = Math.max(this._val1, this._val2);

        $(this._bar).css('left', min * this._width);
        $(this._bar).css('width', (max - min) * this._width);

        $(this._label1).css('width', this._labelWidth);
        $(this._label2).css('width', this._labelWidth);

        var label1Pos = min * (this._width) - this._labelWidth / 2 - this._paddingWidth;
        var label2Pos = max * (this._width) - this._labelWidth / 2 - this._paddingWidth;
        if (Math.abs(label2Pos - label1Pos) < this._labelWidth + 2 * this._paddingWidth) {
            var label12Pos = (label2Pos + label1Pos) / 2;
            label1Pos = label12Pos - this._labelWidth / 2 - this._paddingWidth;
            label2Pos = label12Pos + this._labelWidth / 2 + this._paddingWidth;
        }

        $(this._label1).css('left', label1Pos);
        $(this._label2).css('left', label2Pos);

        var range = this._range[1] - this._range[0];
        min = this._range[0] + min * range;
        max = this._range[0] + max * range;

        $(this._label1).children('p').text(Math.round(min * 10) / 10);
        $(this._label2).children('p').text(Math.round(max * 10) / 10);
        $(this._label1).children('p').css('font-size', this._labelWidth / 3 + 'px');
        $(this._label2).children('p').css('font-size', this._labelWidth / 3 + 'px');

        if (range) {
            for (var i = 0; i < this._rangeMarkers.length; i++) {
                var relPos = this._rangeMarkerPositions[i] / range;
                if (relPos > 1) {
                    $(this._rangeMarkers[i]).css('display', 'none');
                } else {
                    $(this._rangeMarkers[i]).css('display', 'inline-block');
                    $(this._rangeMarkers[i]).css('left', relPos * this._width);
                }
            }
        }
    },

    _showLabels: function () {
        $(this._label1).show().css('display', 'inline-table');
        $(this._label2).show().css('display', 'inline-table');
    },

    _hideLabels: function () {
        $(this._label1).hide();
        $(this._label2).hide();
    },

    min: function () {
        var val = Math.min(this._val1, this._val2);
        return this._range[0] + val * (this._range[1] - this._range[0]);
    },

    max: function () {
        var val = Math.max(this._val1, this._val2);
        return this._range[0] + val * (this._range[1] - this._range[0]);
    },

    range: function (range) {
        if (!arguments.length) {
            return this._range.clone();
        }
        this._range = [range[0], range[1]];
        this._val1 = 0;
        this._val2 = 1;
        this._update();
    },

    enable: function () {
        $(this._bar).removeClass('disabled');
        $(this._handle1).removeClass('disabled');
        $(this._handle2).removeClass('disabled');
    },

    disable: function () {
        $(this._bar).addClass('disabled');
        $(this._handle1).addClass('disabled');
        $(this._handle2).addClass('disabled');
    },

    show: function () {
        $(this._container).show();
        this.onResize();
    },

    hide: function () {
        $(this._container).hide();
    },

    onResize: function () {
        var self = this;
        setTimeout(function () {
            if ($(self._domElement).is(':visible')) {
                self._width = $(self._domElement).width();
                self._handleWidth = self._width / 100 * self._handlePercentage;
                self._labelWidth = self._width / 100 * self._labelPercentage;
                self._paddingWidth = self._width / 100 * self._paddingPercentage;
                self._left = $(self._domElement).offset().left;
                self._update();
            }
        }, 50);
    },

    onMove: function () {
        this._left = $(this._domElement).offset().left;
    }
};