function setCookie(name, value, expDays) {
    var now = new Date();
    now.setTime(now.getTime() + (expDays * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + now.toGMTString();
    document.cookie = name + '=' + value + '; ' + expires + '; path=/';
}

function replaceCookie(name, value, expDays) {
    var now = new Date();
    var expires = 'expires=' + now.toGMTString();
    document.cookie = name + '=; ' + expires + '; path=/';
    setCookie(name, value, expDays);
}

var virtualClick = false;
$(document).ready(function () {
    $('.tab-links .tab-link').on('click', function (event) {
        virtualClick = false;
        event.preventDefault();
        var div = $(this).children(':first').attr('href');
        $('.tab-contents ' + div).show().siblings().hide();
        $('.tab').html('');
        $(this).addClass('active').siblings().removeClass('active');
        var page = div.substr(1);
        $(div).load(page + '.html', function (responseText, textStatus, XmlHttpRequest) {
            if (textStatus != 'success') {
                window.location.href = '/dashboard/index.html';
                window.location.reload();
            }
            window.location = '/dashboard/index.html#' + page.slice(0, -3);
        });
    });

    virtualClick = true;
    $(window).trigger('hashchange');
});

$(window).on('hashchange', function () {
    if (virtualClick) {
        var hash = window.location.hash;
        var tab = hash.substr(1);
        if (tab) {
            $('#' + tab + 'tabbutton').trigger('click');
        } else {
            $('.tab-links .tab-link.active').trigger('click');
        }
    }
});

function login() {
    $('#loginerror').html('');
    var name = $('#loginname').val();
    var password = $('#loginpw').val();
    if (name.length && password.length) {
        $.ajax({
            type: 'POST',
            url: '/',
            data: {
                type: 'login',
                name: name,
                password: password
            },
            success: function (response) {
                virtualClick = true;
                window.location = '/dashboard/index.html#profile';
                window.location.reload();
            },
            error: function (error) {
                switch (error.status) {
                case 403:
                    $('#loginerror').html('Wrong username and/or password.');
                    break;
                case 500:
                    $('#loginerror').html('Serverside error during login.');
                    break;
                }
            }
        });
    } else {
        $('#loginerror').html('Fill in name and password.');
    }
}

function register() {
    $('#registererror').html('');
    var name = $('#registername').val();
    var password1 = $('#registerpw1').val();
    var password2 = $('#registerpw2').val();
    if (name.length && password1.length && password2.length) {
        if (name.indexOf(',') != -1) {
            $('#registererror').html('Username contains invalid characters.');
            return;
        }
        if (password1 == password2) {
            $.ajax({
                type: 'POST',
                url: '/',
                data: {
                    type: 'register',
                    name: name,
                    password: password1
                },
                success: function (response) {
                    if (response == 'OK') {
                        virtualClick = true;
                        window.location = '/dashboard/index.html#profile';
                        window.location.reload();
                    } else {
                        $('#registererror').html(response);
                    }
                },
                error: function (error) {
                    $('#registererror').html('Serverside error during registering.');
                }
            });
        } else {
            $('#registererror').html('Passwords do not match.');
        }
    } else {
        $('#registererror').html('Fill in all fields.');
    }
}