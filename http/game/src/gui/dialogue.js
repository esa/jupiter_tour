/* Class Dialogue
    Universal dialogue window
*/
gui.Dialogue = function (sourceURL) {
    var self = this;
    this._sourceURL = sourceURL;

    this._container = document.createElement('div');
    this._container.className = 'dialogue';

    var headerDiv = document.createElement('div');
    headerDiv.className = 'header';

    this._titleDiv = document.createElement('div');
    this._titleDiv.className = 'title text-fit';
    this._titleDiv.textContent = 'help';

    var col = document.createElement('div');
    col.className = 'close-button-container';

    var closeButton = document.createElement('img');
    closeButton.className = 'close-button center-vertically';
    closeButton.src = 'res/svg/cancel.svg';
    closeButton.onclick = function () {
        self.close();
    };

    col.appendChild(closeButton);

    this._contentDiv = document.createElement('div');
    this._contentDiv.className = 'content';

    headerDiv.appendChild(this._titleDiv);
    headerDiv.appendChild(col);

    this._resizeDiv = document.createElement('div');
    this._resizeDiv.className = 'resize';

    this._container.appendChild(headerDiv);
    this._container.appendChild(this._contentDiv);
    this._container.appendChild(this._resizeDiv);
};
gui.Dialogue.prototype = {
    constructor: gui.Dialogue,

    open: function () {
        var self = this;
        document.body.appendChild(this._container);
        var md1 = new utility.MouseDriver(this._titleDiv);
        md1.registerLeftDrag(function (event) {
            var diffX = event.deltaX;
            var diffY = event.deltaY;

            var container = $(self._container);
            var position =  container.position();

            container.css('left', position.left + diffX);
            container.css('top', position.top + diffY);
            utility.fitText();
        });

        /*var md2 = new utility.MouseDriver(this._resizeDiv);
        md2.registerLeftDrag(function (event) {
            var diffX = event.deltaX;
            var diffY = event.deltaY;

            var container = $(self._container);
            var position =  container.position();
            var width = container.width();
            var height = container.height();

            container.css('width', width + diffX);
            container.css('height', height + diffY);
            container.css('left', position.left + diffX);
            container.css('top', position.top + diffY);
            utility.fitText();
        });
        */
        utility.fitText();

        net.sendGETRequest(this._sourceURL, 'html', {}, function (response) {
                self._contentDiv.innerHTML = response;
            },
            function (error) {
                self._contentDiv.innerHTML =  'error';
            });
    },

    close: function () {
        document.body.removeChild(this._container);
    }
};