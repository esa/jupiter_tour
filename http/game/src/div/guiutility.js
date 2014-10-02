/* GUI UTILITY
    These functions can contain library calls and members which require a browser environment.

*/
(function () {
    utility.BrowserTypes = {
        CHROME: 0,
        FIREFOX: 1
    };

    if (/Firefox/i.test(navigator.userAgent)) {
        utility.BROWSER_TYPE = utility.BrowserTypes.FIREFOX;
        utility.MOUSE_WHEEL_EVENT = 'DOMMouseScroll';
    } else {
        utility.BROWSER_TYPE = utility.BrowserTypes.CHROME;
        utility.MOUSE_WHEEL_EVENT = 'mousewheel';
    }
})();

utility.fitText = function () {
    $('.text-fit').fitText();
};