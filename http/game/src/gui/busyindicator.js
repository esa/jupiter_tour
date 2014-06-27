/* Class BusyIndicator */
gui.BusyIndicator = function () {
    this._isVisible = false;
    this._domElement = document.createElement('div');
    this._domElement.className = 'busy-indicator';
    this._domElement.style.display = 'none';
    var img = document.createElement('img');
    img.src = 'res/img/busy.gif';
    img.alt = 'busy ...';
    this._domElement.appendChild(img);
    document.body.appendChild(this._domElement);
};
gui.BusyIndicator.prototype = {
    constructor: gui.BusyIndicator,

    show: function () {
        this._domElement.style.display = 'block';
        this._isVisible = true;
    },

    hide: function () {
        this._domElement.style.display = 'none';
        this._isVisible = false;
    },

    isVisible: function () {
        return this._isVisible;
    }
};