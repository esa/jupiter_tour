/* GUI UTILITY
    These functions can contain library calls and members which require a browser environment.

*/
utility.MOUSE_WHEEL_EVENT = (/Firefox/i.test(navigator.userAgent)) ? 'DOMMouseScroll' : 'mousewheel';

utility.fitText = function () {
    $('.text-fit').fitText();
};