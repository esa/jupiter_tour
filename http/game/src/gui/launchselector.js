/* Class LaunchSelector
    Interface for specifying the launch boundaries
*/
gui.LaunchSelector = function (launchConstraints, currentBody) {
    var self = this;
    this._launcher = launchConstraints.launcher;
    this._launchEpochBounds = launchConstraints.launchEpochBounds.clone();
    this._timeOfFlightBounds = launchConstraints.timeOfFlightBounds.clone();
    this._currentBody = currentBody;
    this._configuration = null;
    this._isOpened = false;
    this._container = document.createElement('div');
    this._container.className = 'launch-selector-container center-vertically center-horizontally unselectable';
    this._container.oncontextmenu = function () {
        return false;
    };

    var titleRow = document.createElement('div');
    titleRow.className = 'row1 text-fit';

    var title = document.createElement('div');
    title.className = 'title';
    title.textContent = 'configure launch from ' + this._currentBody.getName();
    titleRow.appendChild(title);

    var contentRow = document.createElement('div');
    contentRow.className = 'row2';
    var col1 = document.createElement('div');
    col1.className = 'col1';

    var launcherTitle = document.createElement('div');
    launcherTitle.className = 'col-title left text-fit';
    launcherTitle.textContent = 'launcher: ' + this._launcher.name;
    var launcherImgWrapper = document.createElement('div');
    launcherImgWrapper.className = 'col1-wrapper';
    var launcherImg = document.createElement('img');
    launcherImg.ondragstart = function () {
        return false;
    };
    launcherImg.className = 'launcher-img';
    launcherImg.src = this._launcher.imageURL;
    launcherImgWrapper.appendChild(launcherImg);

    col1.appendChild(launcherTitle);
    col1.appendChild(launcherImgWrapper);

    var col2 = document.createElement('div');
    col2.className = 'col2';

    var constraintsTitle = document.createElement('div');
    constraintsTitle.className = 'col-title right text-fit';
    constraintsTitle.textContent = 'launch constraints';
    var constraintsWrapper = document.createElement('div');
    constraintsWrapper.className = 'col2-wrapper';

    col2.appendChild(constraintsTitle);
    col2.appendChild(constraintsWrapper);

    var launchRow = document.createElement('div');
    launchRow.className = 'row3';

    var launchButton = document.createElement('div');
    launchButton.className = 'launch button text-fit';
    launchButton.textContent = 'confirm';
    launchButton.onclick = function () {
        self._onLaunchButtonClick();
    };
    launchRow.appendChild(launchButton);

    var cancelButton = document.createElement('div');
    cancelButton.className = 'cancel button text-fit';
    cancelButton.textContent = 'cancel';
    cancelButton.onclick = function () {
        self._onCancelButtonClick();
    };
    launchRow.appendChild(cancelButton);

    var row = document.createElement('div');
    row.className = 'row';
    var wrapper = document.createElement('div');
    wrapper.className = 'icon-wrapper';
    row.appendChild(wrapper);
    var div = document.createElement('div');
    div.className = 'slider-wrapper';
    var img = document.createElement('img');
    img.src = 'res/svg/calendar.svg';
    img.className = 'icon center-vertically center-horizontally';
    wrapper.appendChild(img);
    wrapper = document.createElement('div');
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.title = 'configure launch epoch bounds';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';
    this._launchEpochRangeSlider = new gui.RangeSlider(wrapper);
    div.appendChild(wrapper);
    row.appendChild(div);
    constraintsWrapper.appendChild(row);


    row = document.createElement('div');
    row.className = 'row';
    wrapper = document.createElement('div');
    wrapper.className = 'icon-wrapper';
    row.appendChild(wrapper);
    div = document.createElement('div');
    div.className = 'slider-wrapper';
    img = document.createElement('img');
    img.src = 'res/svg/clock.svg';
    img.className = 'icon center-vertically center-horizontally';
    wrapper.appendChild(img);
    wrapper = document.createElement('div');
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.title = 'configure time of flight bounds';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';
    this._timeOfFlightRangeSlider = new gui.RangeSlider(wrapper);
    div.appendChild(wrapper);
    row.appendChild(div);
    constraintsWrapper.appendChild(row);

    row = document.createElement('div');
    row.className = 'row';
    wrapper = document.createElement('div');
    wrapper.className = 'icon-wrapper';
    row.appendChild(wrapper);
    div = document.createElement('div');
    div.className = 'slider-wrapper';
    img = document.createElement('img');
    img.src = 'res/svg/deltav.svg';
    img.className = 'icon center-vertically center-horizontally';
    wrapper.appendChild(img);
    wrapper = document.createElement('div');
    wrapper.className = 'rangeslider-wrapper center-vertically center-horizontally';
    wrapper.title = 'configure maximum launcher velocity bounds';
    wrapper.style.height = '60%';
    wrapper.style.width = '90%';
    this._velocityRangeSlider = new gui.RangeSlider(wrapper);
    div.appendChild(wrapper);
    row.appendChild(div);
    constraintsWrapper.appendChild(row);

    contentRow.appendChild(col1);
    contentRow.appendChild(col2);
    this._container.appendChild(titleRow);
    this._container.appendChild(contentRow);
    this._container.appendChild(launchRow);
    document.body.appendChild(this._container);

    this._timeOfFlightRangeSlider.range(this._timeOfFlightBounds);
    this._launchEpochRangeSlider.range(this._launchEpochBounds);
    this._velocityRangeSlider.range([1, this._launcher.deltaV]);

    window.addEventListener('resize', function (event) {
        self._onResize(event);
    });
    this._onResize();
    utility.fitText();
    this._isOpened = true;
    $('html,body').css('cursor', 'default');
};
gui.LaunchSelector.prototype = {
    constructor: gui.LaunchSelector,

    _onLaunchButtonClick: function () {
        this._configuration = {
            velocityBounds: [this._velocityRangeSlider.min(), this._velocityRangeSlider.max()],
            launchEpochBounds: [this._launchEpochRangeSlider.min(), this._launchEpochRangeSlider.max()],
            timeOfFlightBounds: [this._timeOfFlightRangeSlider.min(), this._timeOfFlightRangeSlider.max()]
        };
        this.close();
    },

    _onCancelButtonClick: function () {
        this._configuration = null;
        this.close();
    },

    _onResize: function () {
        this._timeOfFlightRangeSlider.onResize();
        this._launchEpochRangeSlider.onResize();
        this._velocityRangeSlider.onResize();
    },

    close: function () {
        this._container.remove();
        this._isOpened = false;
    },

    isInConfigurationMode: function () {
        return this._isOpened;
    },

    getConfiguration: function () {
        return this._configuration;
    },
};