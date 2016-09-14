var debug = true;
var cache = {tree: '', clinic: []};

var Config = {
    title: 'Reservation'
    , api: 'http://iranappsazan.ddns.net:8080/myapi/api/action/reservation'
    , media: 'http://iranappsazan.ddns.net:8080/myapi/api/file/download/image/'
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
            debug && console.log(Global.t() + ' Parts: ' + parts);
            return parts;
        } else {
            debug && console.warn(Global.t() + ' No url fragments!');
            // Go to main page
            Location.redirect('doctors', true);
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
    , getId: function () {
        return (typeof Location.parts[1] !== "undefined" && Location.parts[1]) ? Location.parts[1] : null;
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
    , createDate: function (offset) {
        var output = '';
        if (typeof offset === 'undefined' || offset === '')
            offset = 0;
        var date = new Date();
        date.setDate(date.getDate() + offset);
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();
        if (dd < 10)
            dd = '0' + dd;
        if (mm < 10)
            mm = '0' + mm;
        output = yyyy + '-' + mm + '-' + dd;
        return output;
    }
    , handlebarHelpers: function () {
        if (typeof Handlebars === "undefined")
            return false;
        Handlebars.registerHelper('times', function (n, block) { // Loop a block starting at 0
            var accum = '';
            for (var i = 0; i < n; ++i)
                accum += block.fn(i);
            return accum;
        });
        Handlebars.registerHelper('debug', function (value, options) {
            console.log(value);
        });
        Handlebars.registerHelper('htimes', function (n, block) { // Loop a block starting at 1 [human-readable times]
            var accum = '';
            for (var i = 1; i < (n + 1); ++i)
                accum += block.fn(i);
            return accum;
        });
        Handlebars.registerHelper('for', function (from, to, incr, block) { // For loop {{#for i to steps}} -> {{#for 0 10 2}}
            var accum = '';
            for (var i = from; i < to; i += incr)
                accum += block.fn(i);
            return accum;
        });
        Handlebars.registerHelper('ifCond', function (v1, v2, options) {
            if (v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
        Handlebars.registerHelper('ifCondNot', function (v1, v2, options) {
            if (v1 !== v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        });
        Handlebars.registerHelper('ifActive', function (val, options) {
            var currentID = (typeof Location.parts[2] === "undefined") ? 0 : Location.parts[2];
            if (parseInt(val) === parseInt(currentID)) {
                return "grey-cascade";
            }
            return "btn-default";
        });
        Handlebars.registerHelper('stringify', function (obj, options) {
            if (typeof obj === "object") {
                $.each(obj, function () {
                    delete this.raw;
                });
            }
            var output = (typeof obj === "object") ? JSON.stringify(obj) : obj;
            return output;
        });
        Handlebars.registerHelper('Bool2Label', function (val, options) {
            var output = '';
            if (val === true) {
                output = '<span class="label label-success">Yes</label>';
            } else {
                output = '<span class="label label-warning">No</label>';
            }
            return output;
        });
        Handlebars.registerHelper('Num2Label', function (val, options) {
            var output = '';
            switch (val) {
                case 0:
                    output = '<span class="label label-warning">No</label>';
                    break;
                case 1:
                    output = '<span class="label label-success">Yes</label>';
                    break;
            }
            return output;
        });
        Handlebars.registerHelper('isChecked', function (val, options) {
            var output = '';
            if (val === true || val === 1) {
                output = 'checked';
            }
            return output;
        });
        Handlebars.registerHelper('cycle', function (value, block) {
            var values = value.split(' ');
            return values[block.data.index % (values.length + 1)];
        });
        Handlebars.registerHelper('select', function (value, options) {
            var $el = $('<select />').html(options.fn(this));
            $el.find('[value=' + value + ']').attr({'selected': 'selected'});
            return $el.html();
        });
        Handlebars.registerHelper('date', function (offset, options) {
            return Global.createDate(offset);
        });
        Handlebars.registerHelper('id', function (offset, options) {
            if (typeof Location.parts[1] !== "undefined" && Location.parts[1])
                return Location.parts[1];
        });

        Handlebars.registerHelper('id2', function (offset, options) {
            if (typeof Location.parts[2] !== "undefined" && Location.parts[2])
                return Location.parts[2];
        });
        Handlebars.registerHelper('pageHasId', function (options) {
            if (typeof Location.parts[1] !== "undefined" && Location.parts[1])
                return options.fn(this);
        });
        Handlebars.registerHelper('selectByPageId', function (options) {
            var $el = $('<select />').html(options.fn(this));
            if (typeof Location.parts[1] !== "undefined" && Location.parts[1])
                $el.find('[value=' + Location.parts[1] + ']').attr({'selected': 'selected'});
            return $el.html();
        });
        Handlebars.registerHelper('getToken', function (options) {
            return token.clinic;
        });
        Handlebars.registerHelper('selectByTokenClinic', function (options) {
            var $el = $('<select />').html(options.fn(this));
            if (typeof token.clinic !== "undefined" && token.clinic)
                $el.find('[value=' + token.clinic + ']').attr({'selected': 'selected'});
            return $el.html();
        });
        Handlebars.registerHelper('tokenId', function (options) {
            return token.guid;
        });
        Handlebars.registerHelper('getDoctorName', function (value, options) {
            var data = '';
            var id = (typeof Location.parts[1] !== "undefined" && Location.parts[1]) ? Location.parts[1] : null;
            if (id) {
                var o = Data.createObject({Action: 'DoctorsGetOne', Params: {Guid: id}});
                o.async = false;
                o.success = function (d) {
                    d = typeof d === "string" ? JSON.parse(d) : d;
                    data = d.Items[0].Name + ' ' + d.Items[0].Famili;
                }
                $.ajax(o);
                return data;
            }
        });
        Handlebars.registerHelper('getUserName', function (value, options) {
            var data = '';
            if (value) {
                var o = Data.createObject({Action: 'UsersGetOne', Params: {Guid: value}});
                o.async = false;
                o.success = function (d) {
                    d = typeof d === "string" ? JSON.parse(d) : d;
                    data = d.Items[0].Name + ' ' + d.Items[0].Famili;
                }
                $.ajax(o);
                return data;
            }
        });
        Handlebars.registerHelper('getVisitName', function (value, options) {
            var data = '';
            if (value) {
                var o = Data.createObject({Action: 'VisitGetOne', Params: {Guid: value}});
                o.async = false;
                o.success = function (d) {
                    d = typeof d === "string" ? JSON.parse(d) : d;
                    data = d.Items[0].Name;
                }
                $.ajax(o);
                return data;
            }
        });
        Handlebars.registerHelper('getManagerName', function (value, options) {
            var data = '';
            if (value) {
                var o = Data.createObject({Action: 'ManagerGetOne', Params: {Guid: value}});
                o.async = false;
                o.success = function (d) {
                    d = typeof d === "string" ? JSON.parse(d) : d;
                    data = d.Items[0].Name + ' ' + d.Items[0].Famili;
                }
                $.ajax(o);
                return data;
            }
        });
        Handlebars.registerHelper('managersSelect', function (value, options) {
            if (typeof cache.ManagerGetAll !== "undefined")
                return cache.ManagerGetAll;
            var data = '<select name="ManagerGuid" class="form-control">';
            var o = Data.createObject({Action: 'ManagerGetAll', Params: {}});
            o.async = false;
            o.success = function (d) {
                d = typeof d === "string" ? JSON.parse(d) : d;
                $.each(d.Items, function () {
                    data += '<option value="' + this.Guid + '">' + this.Name + ' ' + this.Famili + ' [' + this.UserName + ']' + '</option>';
                });
                data += '</select>';
                cache.ManagerGetAll = data;
            }
            $.ajax(o);
            return data;
        });
        Handlebars.registerHelper('usersSelect', function (value, arg, options) {
            if (typeof cache.UsersGetAll !== "undefined")
                return cache.UsersGetAll;
//            cssClass = (typeof arg !== "undefined" && arg !== "") ? ' ' + arg : '';
            var data = '<select name="UserGuid" class="form-control simple no-edit rtl">';
            var o = Data.createObject({Action: 'UsersGetAll', Params: {}});
            o.async = false;
            o.success = function (d) {
                d = typeof d === "string" ? JSON.parse(d) : d;
                $.each(d.Items, function () {
                    data += '<option value="' + this.Guid + '">' + this.Name + ' ' + this.Famili + ' [' + this.UserName + ']' + '</option>';
                });
                data += '</select>';
                cache.UsersGetAll = data;
            }
            $.ajax(o);
            return data;
        });
        Handlebars.registerHelper('visitsSelect', function (value, options) {
            var clinic = String(token.clinic);
            if (typeof cache.clinic[clinic] !== "undefined")
                return cache.clinic[clinic];
            var data = '<select name="VisitGuid" class="form-control simple no-edit rtl">';
            var o = Data.createObject({Action: 'VisitGetByClinic', Params: {ClinicGuid: clinic}});
            o.async = false;
            o.success = function (d) {
                d = typeof d === "string" ? JSON.parse(d) : d;
                $.each(d.Items, function () {
                    data += '<option value="' + this.Guid + '">' + this.Name + '</option>';
                });
                data += '</select>';
                cache.clinic[clinic] = data;
            }
            $.ajax(o);
            return data;
        });
        Handlebars.registerHelper('expertSelect', function (value, options) {
            if (typeof cache.tree === "undefined" || cache.tree === "") {
                var o = Data.createObject({Action: 'ExpertGetAll'});
                o.async = false;
                o.success = function (d) {
                    d = (typeof d !== "object") ? JSON.parse(d).Items : d.Items;
                    Data.prepareTree(d);
                }
                $.ajax(o);
            }
            return cache.tree;
        });
        Handlebars.registerHelper('convert2Jalali', function (value, options) {
            return Global.convertDateTime(value);
        });
        Handlebars.registerHelper('getDate', function (arg1, arg2, options) {
            var parts = Location.parts;
            var output = (parts[parseInt(arg1)].length && parts[parseInt(arg1)] !== "undefined") ? parts[parseInt(arg1)] : Global.createDate(parseInt(arg2));
            return Global.convertDate2Gregorian(output, '-');
        });
    }
    , convertDate: function (datetime, splitter) {
        splitter = (typeof splitter !== "undefined") ? splitter : '/';
        if (typeof datetime !== "string")
            return '';
        var JDate = require('jdate');
        var d = datetime.split(' ')[0].split(splitter).reverse();
        var jdate = new JDate(new Date(d[0], (parseInt(d[2]) - 1), d[1]));
        return jdate.date.join('-');
    }
    , convertDate2Gregorian: function (datetime, splitter) {
        splitter = (typeof splitter !== "undefined") ? splitter : '/';
        var datetime = datetime.split(' ');
        var date = datetime[0].split(splitter);
        var JDate = require('jdate');
        var gdate = JDate.to_gregorian(parseInt(date[0]), parseInt(date[1]), parseInt(date[2]));
        return greg_date = gdate.getFullYear() + '-' + Global.zeroFill(gdate.getMonth() + 1) + '-' + Global.zeroFill(gdate.getDate());
    }
    , convertDateTime: function (datetime) {
        var JDate = require('jdate');
        var dt = datetime.split(' ');
        var d = dt[0].split("/").reverse();
        var jdate = new JDate(new Date(d[0], d[1], d[2]));
        return jdate.date.join('-') + ' ' + dt[1];
    }
    , setClinic: function (element) {
        token.clinic = $(element).find("option:selected").val();
        Cookie.set(JSON.stringify(token));
        Location.refresh();
        return true;
    }
    , dynamicSort: function (property) {
        var sortOrder = 1;
        if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a, b) {
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    }
    , cloneObject: function (obj) {
        var copy;
        if (null == obj || "object" != typeof obj)
            return obj;
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = Global.cloneObject(obj[i]);
            }
            return copy;
        }
        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr))
                    copy[attr] = Global.cloneObject(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    }
};

$(document).ajaxStart(function (e) {
    if ($("#progress").length === 0) { //only add progress bar if added yet.
        $("body").append($("<div><dt/><dd/></div>").attr("id", "progress"));
        $("#progress").width((50 + Math.random() * 30) + "%");
    }
});
$(document).ajaxComplete(function () {
    $("#progress").width("101%").delay(200).fadeOut(400, function () { //End loading animation
//        $(this).remove();
    });
});