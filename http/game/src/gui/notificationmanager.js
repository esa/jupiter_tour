/* Class NotificationManager. 
    Handles the display of notifications to the user. 
*/
gui.NotificationManager = function () {
    $.notify.addStyle('errormsg', {
        html: '<div style="display:table;border-spacing:1vmin;padding:0;box-sizing:border-box;"><div style="display:table-row;"><div style="display:table-cell;"><img src="res/svg/erroricon.svg" style="height:3.5vmin;width:auto;display:block;"></img></div><div style="display:table-cell;vertical-align:middle;"><span data-notify-text/></div></div></div>',
        classes: {
            base: {
                'white-space': 'nowrap',
                'color': '#cccccc',
                'font-size': '1.5vmin',
                'background-color': 'none',
                'padding': '1vmin',
            }
        }
    });
    $.notify.addStyle('spacecraftmsg', {
        html: '<div style="display:table;border-spacing:1vmin;padding:0;box-sizing:border-box;"><div style="display:table-row;"><div style="display:table-cell;"><img src="res/svg/spacecrafticon.svg" style="height:3.5vmin;width:auto;display:block;"></img></div><div style="display:table-cell;vertical-align:middle;"><span data-notify-text/></div></div></div>',
        classes: {
            base: {
                'white-space': 'nowrap',
                'color': '#cccccc',
                'font-size': '1.5vmin',
                'background-color': 'none',
                'padding': '1vmin',
            }
        }
    });
    $.notify.addStyle('moonmsg', {
        html: '<div style="display:table;border-spacing:1vmin;padding:0;box-sizing:border-box;"><div style="display:table-row;"><div style="display:table-cell;"><img src="res/svg/moonicon.svg" style="height:3.5vmin;width:auto;display:block;"></img></div><div style="display:table-cell;vertical-align:middle;"><span data-notify-text/></div></div></div>',
        classes: {
            base: {
                'white-space': 'nowrap',
                'color': '#cccccc',
                'font-size': '1.5vmin',
                'background-color': 'none',
                'padding': '1vmin',
            }
        }
    });
    $.notify.addStyle('planetmsg', {
        html: '<div style="display:table;border-spacing:1vmin;padding:0;box-sizing:border-box;"><div style="display:table-row;"><div style="display:table-cell;"><img src="res/svg/planeticon.svg" style="height:3.5vmin;width:auto;display:block;"></img></div><div style="display:table-cell;vertical-align:middle;"><span data-notify-text/></div></div></div>',
        classes: {
            base: {
                'white-space': 'nowrap',
                'color': '#cccccc',
                'font-size': '1.5vmin',
                'background-color': 'none',
                'padding': '1vmin',
            }
        }
    });
    $.notify.addStyle('infomsg', {
        html: '<div style="display:table;border-spacing:1vmin;padding:0;box-sizing:border-box;"><div style="display:table-row;"><div style="display:table-cell;"><img src="res/svg/infoicon.svg" style="height:3.5vmin;width:auto;display:block;"></img></div><div style="display:table-cell;vertical-align:middle;"><span data-notify-text/></div></div></div>',
        classes: {
            base: {
                'white-space': 'nowrap',
                'color': '#cccccc',
                'font-size': '1.5vmin',
                'background-color': 'none',
                'padding': '1vmin',
            }
        }
    });
    $.notify.addStyle('finishmsg', {
        html: '<div style="display:table;border-spacing:1vmin;padding:0;box-sizing:border-box;"><div style="display:table-row;"><div style="display:table-cell;"><img src="res/svg/finishicon.svg" style="height:3.5vmin;width:auto;display:block;"></img></div><div style="display:table-cell;vertical-align:middle;"><span data-notify-text/></div></div></div>',
        classes: {
            base: {
                'white-space': 'nowrap',
                'color': '#cccccc',
                'font-size': '1.5vmin',
                'background-color': 'none',
                'padding': '1vmin',
            }
        }
    });
    $.notify.addStyle('invalidmsg', {
        html: '<div style="display:table;border-spacing:1vmin;padding:0;box-sizing:border-box;"><div style="display:table-row;"><div style="display:table-cell;"><img src="res/svg/invalidicon.svg" style="height:3.5vmin;width:auto;display:block;"></img></div><div style="display:table-cell;vertical-align:middle;"><span data-notify-text/></div></div></div>',
        classes: {
            base: {
                'white-space': 'nowrap',
                'color': '#cccccc',
                'font-size': '1.5vmin',
                'background-color': 'none',
                'padding': '1vmin',
            }
        }
    });
    $.notify.addStyle('landingmsg', {
        html: '<div style="display:table;border-spacing:1vmin;padding:0;box-sizing:border-box;"><div style="display:table-row;"><div style="display:table-cell;"><img src="res/svg/landingicon.svg" style="height:3.5vmin;width:auto;display:block;"></img></div><div style="display:table-cell;vertical-align:middle;"><span data-notify-text/></div></div></div>',
        classes: {
            base: {
                'white-space': 'nowrap',
                'color': '#cccccc',
                'font-size': '1.5vmin',
                'background-color': 'none',
                'padding': '1vmin',
            }
        }
    });
    $.notify.addStyle('launchmsg', {
        html: '<div style="display:table;border-spacing:1vmin;padding:0;box-sizing:border-box;"><div style="display:table-row;"><div style="display:table-cell;"><img src="res/svg/launchicon.svg" style="height:3.5vmin;width:auto;display:block;"></img></div><div style="display:table-cell;vertical-align:middle;"><span data-notify-text/></div></div></div>',
        classes: {
            base: {
                'white-space': 'nowrap',
                'color': '#cccccc',
                'font-size': '1.5vmin',
                'background-color': 'none',
                'padding': '1vmin',
            }
        }
    });

    this._configuration = {
        // whether to hide the notification on click
        clickToHide: false,
        // whether to auto-hide the notification
        autoHide: true,
        // if autoHide, hide after milliseconds
        autoHideDelay: 10000,
        // show the arrow pointing at the element
        arrowShow: true,
        // arrow size in pixels
        arrowSize: 10,
        // default positions
        elementPosition: 'top center',
        globalPosition: 'left middle',
        // default style
        style: 'infomsg',
        // default class (string or [string])
        className: 'base',
        // show animation
        showAnimation: 'slideDown',
        // show animation duration
        showDuration: 400,
        // hide animation
        hideAnimation: 'slideDown',
        // hide animation duration
        hideDuration: 400,
        // padding between element and notification
        gap: 1
    };
};

gui.NotificationManager.prototype = {
    constructor: gui.NotificationManager,

    clearScreen: function () {
        $('.notifyjs-wrapper').trigger('notify-hide');

        //Necessary since element notifications somehow don't hide with the api call...
        $('.notifyjs-wrapper').children().each(function () {
            $(this).finish();
            $(this).hide();
        });
    },

    dispatchLandingMsg: function (text) {
        var config = utility.clone(this._configuration);
        config.style = 'landingmsg';
        $.notify(text, config);
    },

    dispatchLaunchMsg: function (text) {
        var config = utility.clone(this._configuration);
        config.style = 'launchmsg';
        $.notify(text, config);
    },

    dispatchErrorMsg: function (text) {
        var config = utility.clone(this._configuration);
        config.style = 'errormsg';
        $.notify(text, config);
    },

    dispatchSpacecraftMsg: function (text, autoHide) {
        var config = utility.clone(this._configuration);
        config.autoHide = (autoHide != null ? autoHide : true);
        config.style = 'spacecraftmsg';
        $.notify(text, config);
    },

    dispatchMoonMsg: function (text) {
        var config = utility.clone(this._configuration);
        config.style = 'moonmsg';
        $.notify(text, config);
    },

    dispatchPlanetMsg: function (text) {
        var config = utility.clone(this._configuration);
        config.style = 'planetmsg';
        $.notify(text, config);
    },

    dispatchInfoMsg: function (text) {
        var config = utility.clone(this._configuration);
        config.style = 'infomsg';
        $.notify(text, config);
    },

    dispatchFinishMsg: function (text) {
        var config = utility.clone(this._configuration);
        config.autoHide = false;
        config.style = 'finishmsg';
        $.notify(text, config);
    },

    dispatchInvalidMsg: function (text) {
        var config = utility.clone(this._configuration);
        config.autoHide = false;
        config.style = 'invalidmsg';
        $.notify(text, config);
    },

    dispatchInfoMsgAt: function (selector, text, autoHide) {
        var config = utility.clone(this._configuration);
        config.style = 'infomsg';
        config.autoHide = false;
        $(selector).notify(text, config);
        if (autoHide) {
            setTimeout(function () {
                $(selector).siblings('.notifyjs-wrapper').children().each(function () {
                    $(this).finish();
                    $(this).hide();
                });
            }, config.autoHideDelay);
        }
    }
};

//Preload Icon images
(function () {
    var preloadImages = ['res/svg/erroricon.svg', 'res/svg/spacecrafticon.svg', 'res/svg/moonicon.svg', 'res/svg/infoicon.svg', 'res/svg/finishicon.svg', 'res/svg/invalidicon.svg', 'res/svg/planeticon.svg', 'res/svg/landingicon.svg', 'res/svg/launchicon.svg'];
    preloadImages.forEach(function (imgURL) {
        var img = new Image();
        img.src = imgURL;
    });
})();