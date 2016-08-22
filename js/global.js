var debug = true;

var Config = {
    title: 'Reservation'
    , api: 'http://iranappsazan.ddns.net:8080/myapi/api/action/reservation'
};
var Cookie = {
    lifetime: 1000000 // exp in seconds
    , title: 'meta_cookie='
    , init: function () {
        var Cookie = this;
    }
    , check: function (cname) {
        if (typeof cname === 'undefined')
            var cname = Cookie.title;
        return Cookie.get(Cookie.title);
    }
    , parse: function (data) {
        if (typeof data !== 'undefined') {
            return data;
        }
        return false;
    }
    , delete: function (cname) {
        if (typeof cname === 'undefined')
            var cname = Cookie.title;
        var expires = 'Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = cname + '' + '; ' + expires + '; path=/';
    }
    , set: function (data, cname) {
        if (typeof cname === 'undefined')
            var cname = Cookie.title;
        // validating paramters
        var cname = Cookie.title;
        var d = new Date();
        d.setTime(d.getTime() + (Cookie.lifetime * 1000));
        var expires = 'expires=' + d.toGMTString();
        document.cookie = cname + data + '; ' + expires + '; path=/';
        return data;
    }
    , get: function (cname) {
        if (typeof cname === 'undefined')
            var cname = Cookie.title;
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(cname) === 0)
                return Cookie.parse(c.substring(cname.length, c.length));
        }
        return "";
    }
};
var Location = {
    splitter: '#'
    , parts: []
    , history: []
    , 'setParts': {set: function (x) {
            this.parts = x;
        }}
    , init: function () {
        if (location.href.indexOf("login") === -1) {
            Location.getCurrent();
            $(window).on('hashchange', function () {
                Location.getCurrent();
                Data.reload(Location.parts);
            });
        }
    }
    , getCurrent: function () {
        var fragments = location.href.split(Location.splitter)[1];
        Location.parts = Location.parse(fragments);
        Location.handleMenus(Location.parts[0]);
        if (Location.parts[0] === 'history' && Location.parts[1] === 'back')
            if (Location.history.length > 1)
                Location.goBack();
            else
                Location.redirect('index.html', true); // Go to index
        Location.history.push(fragments);
    }
    , get: function (full) {
        return (typeof full !== "undefined" && full === true) ? location.href : location.pathname;
    }
    , parse: function (fragments) {
        if (typeof fragments !== "undefined") {
            var parts = fragments.split('/');
            Location.parts = parts;
            debug && console.warn(Global.t() + ' Parts: ' + parts);
            return parts;
        } else {
            debug && console.warn(Global.t() + ' No url fragments!');
            // Go to main page
            Location.redirect('reservations', true);
        }
        return false;
    }
    , goBack: function (back) {
        if (typeof back !== "undefined" && back === true) {
            debug && console.log('Redirecting to: Previous page');
            var redirect = Location.history[Location.history.length - 2];
            window.location.href = ((Config.html5mode === false) ? '#' : '') + redirect;
        }
    }
    , redirect: function (url, forceLegacyMode) {
        debug && console.log(Global.t() + ' Redirecting to: ' + url);
        window.location.href = (((Config.html5mode === false || (typeof forceLegacyMode !== "undefined" && forceLegacyMode === true))) ? '#' : '') + url;
        return true;
    }
    , refresh: function () {
        location.reload();
    }
    , paths: {
    }
    , handleMenus: function (href) {
        $(function () {
            var $menu = $("#menu");
            var $item = $menu.find('a[href$="' + href + '"]');
            if ($item.length) {
                if (!$item.parent().hasClass("active")) {
                    $menu.find("li").removeClass("active");
                    $item.parent().addClass("active");
                }
            }
        });
    }
};
var Global = {
    trimChar: function (string, charToRemove) {
        while (string.charAt(0) === charToRemove)
            string = string.substring(1);
        while (string.charAt(string.length - 1) === charToRemove)
            string = string.substring(0, string.length - 1);
        return string;
    }
    , convertTime: function (timestamp) {
        var d = new Date(timestamp * 1000), // Convert the passed timestamp to milliseconds
                yyyy = d.getFullYear(),
                mm = ('0' + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
                dd = ('0' + d.getDate()).slice(-2), // Add leading 0.
                hh = d.getHours(),
                h = hh,
                min = ('0' + d.getMinutes()).slice(-2), // Add leading 0.
                ampm = 'AM',
                time;
        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }
        // ie: 2013-02-18, 8:35 AM	
        time = yyyy + '-' + mm + '-' + dd + ' ' + h + ':' + min + ' ' + ampm;
        return time;
    }
    , t: function (full) {
        if (typeof full !== "undefined" && full === true)
            return (new Date).getTime();
        else
            return ((new Date).getTime()).toString().substr(8);
    }
    , periodicals: function (time) {
        time = (typeof time === "undefined") ? 10000 : time;
        setInterval(function () {
//            debug && console.log(Global.t() + ' Interval Called!');
//            User.getData();
        }, time);
        return true;
    }
    , loadTemplate: function (filename) {
        if (!Global.checkIfExists(filename)) {
            debug && console.log(Global.t() + ' Template: template [' + filename + '] does not exist in page, trying to load it via ajax');
            callback = 'empty';
            $.ajax({
                url: 'templates/' + filename + '.html'
                , cache: false
                , async: false
                , success: function (d) {
                    $("body").append(d);
                    callback = '#' + filename + '-template';
                }
                , error: function () {
                    callback = false;
                    debug && console.log(Global.t() + ' Template: template file not fuond');
                }
            });
            return callback;
        } else {
            debug && console.log(Global.t() + ' Template: template exist, returning it\'s id [' + '#' + filename + '-template]');
            return '#' + filename + '-template';
        }
        return false;
    }
    , checkIfExists: function (filename) {
        if ($('#' + filename + '-template').length) {
            return true;
        } else {
            return false;
        }
    }
    , zeroFill: function (number, size) {
        size = (typeof size !== "undefined") ? size : 2;
        var number = number.toString();
        while (number.length < size)
            number = "0" + number;
        return number;
    }
    , processTime: function (time) {
        if (typeof time !== 'undefined') {
            var times = time.split(":");
            var hours = times[0];
            var minutes = times[1];
            var seconds = times[2];
            seconds = parseInt(seconds, 10) + (parseInt(minutes, 10) * 60) + (parseInt(hours, 10) * 3600);
        } else {
            var seconds = null;
        }
        return seconds;
    }
    , createTime: function (timestamp, showSign) {
        var output;
        var sign;
        showSign = (typeof showSign !== 'undefined') ? true : false;
        if (typeof timestamp !== 'undefined') {
            sign = (timestamp != Math.abs(timestamp)) ? '-' : '+';
            timestamp = Math.abs(timestamp);
            var time = new Date(0, 0, 0, 0, 0, timestamp, 0);
            var hours = zeroFill(time.getHours(), 2);
            var minutes = zeroFill(time.getMinutes(), 2);
            var seconds = zeroFill(time.getSeconds(), 2);
            output = hours + ":" + minutes + ":" + seconds;
            output = (showSign) ? output + sign : output;
        }
        return output;
    }
};