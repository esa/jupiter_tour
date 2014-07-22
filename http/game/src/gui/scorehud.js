/* Class ScoreHud. 
    Displays information about current score 
*/
gui.ScoreHUD = function (gameHistoryManager, params) {
    var self = this;
    this._gameHistoryManager = gameHistoryManager;
    this._funGetTimeUsage = null;
    this._funGetWinningProgress = null;
    if (params) {
        this._funGetTimeUsage = params.funGetTimeUsage;
        this._funGetWinningProgress = params.funGetWinningProgress;
    }
    this._isVisible = false;

    var centerDiv = document.createElement('div');
    centerDiv.className = 'center-top';

    var scoreHUDDiv = document.createElement('div');
    scoreHUDDiv.className = 'score-hud';

    var row1 = document.createElement('div');
    row1.className =  'row1';
    this._domElement = document.createElement('div');
    this._domElement.className = 'plugin-container unselectable';
    this._domElement.oncontextmenu = function () {
        return false;
    };
    this._domElement.style.display = 'none';
    row1.appendChild(this._domElement);

    var row2 = document.createElement('div');
    row2.className = 'row2';

    var img = document.createElement('img');
    img.src = 'res/svg/scoreheader.svg';
    img.className = 'score-header';
    var mouseDriver = new utility.MouseDriver(img);
    mouseDriver.registerLeftDrag(function (event) {
        if (self._isVisible) {
            if (event.deltaY < 0) {
                self._isVisible = false;
                $(self._domElement).slideToggle(500);
            }
        } else {
            if (event.deltaY > 0) {
                self._isVisible = true;
                $(self._domElement).slideToggle(500, function () {
                    utility.fitText();
                });
            }
        }
    });
    row2.appendChild(img);

    var headerContainer = document.createElement('div');
    headerContainer.className = 'header-container center-vertically center-horizontally';

    var iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    img = document.createElement('img');
    img.className = 'icon center-vertically';
    img.src = 'res/svg/statsicon.svg';
    iconDiv.appendChild(img);
    headerContainer.appendChild(iconDiv);

    iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    var barDiv = document.createElement('div');
    barDiv.className = 'bar-container center-vertically'
    this._scoreBar = document.createElement('div');
    this._scoreBar.className = 'score-bar';
    this._scoreText = document.createElement('div');
    this._scoreText.className = 'bar-text text-fit center-horizontally center-vertically';
    barDiv.appendChild(this._scoreBar);
    barDiv.appendChild(this._scoreText);
    iconDiv.appendChild(barDiv);
    headerContainer.appendChild(iconDiv);

    iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    img = document.createElement('img');
    img.className = 'icon center-vertically';
    img.src = 'res/svg/clockicon.svg';
    iconDiv.appendChild(img);
    headerContainer.appendChild(iconDiv);

    iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    barDiv = document.createElement('div');
    barDiv.className = 'bar-container center-vertically'
    this._epochBar = document.createElement('div');
    this._epochBar.className = 'score-bar';
    this._epochText = document.createElement('div');
    this._epochText.className = 'bar-text text-fit center-horizontally center-vertically';
    barDiv.appendChild(this._epochBar);
    barDiv.appendChild(this._epochText);
    iconDiv.appendChild(barDiv);
    headerContainer.appendChild(iconDiv);

    iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    img = document.createElement('img');
    img.className = 'icon center-vertically';
    img.src = 'res/svg/deltavicon.svg';
    iconDiv.appendChild(img);
    headerContainer.appendChild(iconDiv);

    iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    barDiv = document.createElement('div');
    barDiv.className = 'bar-container center-vertically'
    this._deltaVBar = document.createElement('div');
    this._deltaVBar.className = 'score-bar';
    this._deltaVText = document.createElement('div');
    this._deltaVText.className = 'bar-text text-fit center-horizontally center-vertically';
    barDiv.appendChild(this._deltaVBar);
    barDiv.appendChild(this._deltaVText);
    iconDiv.appendChild(barDiv);
    headerContainer.appendChild(iconDiv);

    row2.appendChild(headerContainer);

    scoreHUDDiv.appendChild(row1);
    scoreHUDDiv.appendChild(row2);
    centerDiv.appendChild(scoreHUDDiv);
    document.body.appendChild(centerDiv);
};

gui.ScoreHUD.prototype = {
    constructor: gui.ScoreHUD,

    getPluginDomElement: function () {
        return this._domElement;
    },

    update: function () {
        var gameState = this._gameHistoryManager.getCurrentGameState();
        if (this._funGetTimeUsage) {
            var timeUsgPercentage = this._funGetTimeUsage(gameState) * 100;
            timeUsgPercentage = Math.round(timeUsgPercentage * 100) / 100;
            $(this._epochBar).css('width', timeUsgPercentage + '%');
            $(this._epochText).html((Math.round(gameState.getPassedDays() * 100) / 100) + ' days<br>(' + timeUsgPercentage + '%)');
        } else {
            $(this._epochText).text((Math.round(gameState.getPassedDays() * 100) / 100) + ' days');
        }
        var totalDeltaV = gameState.getVehicle().getTotalDeltaV(1);
        var remainingDV = Math.max(0, gameState.getVehicle().getRemainingDeltaV(1));
        var deltaVPercentage = remainingDV / totalDeltaV * 100;
        deltaVPercentage = Math.round(deltaVPercentage * 100) / 100;
        remainingDV = Math.round(remainingDV * 100) / 100;
        $(this._deltaVText).html(remainingDV + ' m/s<br>(' + deltaVPercentage + '%)');
        $(this._deltaVBar).css('width', deltaVPercentage + '%');

        if (this._funGetWinningProgress) {
            var winProgPercentage = this._funGetWinningProgress(gameState) * 100;
            winProgPercentage = Math.round(winProgPercentage * 100) / 100;
            $(this._scoreBar).css('width', winProgPercentage + '%');
            $(this._scoreText).html(gameState.getScore() + ' points<br>(' + winProgPercentage + '%)');
        } else {
            $(this._scoreText).text(gameState.getScore() + ' points');
        }

    }
};