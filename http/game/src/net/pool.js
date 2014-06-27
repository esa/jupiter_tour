/* Convenient function collection */
(function () {
    function setCookie(name, value, expDays) {
        var date = new Date();
        date.setTime(date.getTime() + (expDays * utility.DAY_TO_SEC * 1000));
        var expires = 'expires=' + date.toGMTString();
        document.cookie = name + '=' + value + '; ' + expires + '; path=/';
    }

    function getCookie(name) {
        name += '=';
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.indexOf(name) == 0) return cookie.substring(name.length, cookie.length);
        }
        return null;
    }

    function replaceCookie(name, value, expDays) {
        var date = new Date();
        var expires = 'expires=' + date.toGMTString();
        document.cookie = name + '=; ' + expires + '; path=/';
        setCookie(name, value, expDays);
    }

    function sendPOSTRequest(params, funOnSuccess, funOnError) {
        $.ajax({
            type: 'POST',
            url: '/',
            data: params,
            success: funOnSuccess,
            error: funOnError
        });
    }

    function sendGETRequest(url, dataType, params, funOnSuccess, funOnError) {
        $.ajax({
            type: 'GET',
            url: url,
            data: params,
            dataType: dataType,
            success: funOnSuccess,
            error: funOnError
        });
    }

    function isLoggedIn() {
        var result = false;
        jQuery.ajax({
            url: '/loginstatus',
            success: function (response) {
                result = response.isLoggedIn;
            },
            error: function () {
                result = false;
            },
            async: false
        });
        return result;
    }

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
        var results = regex.exec(location.search);
        return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    // Exposed Interface
    net.setCookie = setCookie;
    net.replaceCookie = replaceCookie;
    net.getCookie = getCookie;
    net.isLoggedIn = isLoggedIn;
    net.sendPOSTRequest = sendPOSTRequest;
    net.sendGETRequest = sendGETRequest;
    net.getParameterByName = getParameterByName;
})();