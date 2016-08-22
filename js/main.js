function app() {
    this.delegateForms = function () {
        Forms.init();
    };
    this.handleBrowser = function () {
        var title = $("title").text();
        if (title.indexOf(' - ') === -1)
            $("title").text(Config.title);
        Location.init();
        if (typeof Location.parts === "object" && Location.parts.length > 0) {
            Data.load(Location.parts[0]);
        } else {
            // Redirect to homepage
        }
    };
    this.initPlugins = function () {
//        Global.periodicals();
        User.getData();
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-bottom-left",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
    };

    var __construct = function (that) {
        debug && console.log(Global.t() + ' App started.');
        // Check Token Globally
        that.delegateForms();
        that.handleBrowser();
        that.initPlugins();
    }(this);
}

var Data = {
    temp: []
    , post: function (data, action, service) {
        var o = Data.createObject(data, service, 'post');
        o.success = function (d) {
            d = (typeof d === "string") ? JSON.parse(d) : d;
            debug && console.log(Global.t() + ' Received Data: ' + JSON.stringify(d));
            if (d.Result !== "OK") {
                Data.handleAction('toast', d.Result, 'error');
                return false;
            }
            // Service Type
            switch (data.Action) {
                default:
                    if (typeof action !== "undefined" && action === 'show') {
                        Data.show(d, data.Action);
                    }
                    break;
                case 'toast':
                    Data.handleAction('toast', d.Result, 'success');
                    break;
                case 'ManagerLogin':
//                    token = d.Items[0].token;
                    token = {data: d.Items[0].Token, giud: d.Items[0].Guid};
                    Cookie.set(JSON.stringify(token));
                    User.navicateSuccessLogin();
                    break;
            }
        };
        $.ajax(o);
    }
    , createObject: function (data, service, type) {
        type = (typeof type === "undefined") ? 'post' : type;
        service = (typeof service === "undefined") ? Config.api : service;
        var object = {};
        var object = {
            contentType: "application/json"
            , url: service
            , type: type
            , headers: {"Token": (token !== "") ? token.data : ''}
            , data: JSON.stringify(data)
            , error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status + '/' + JSON.parse(xhr.responseText).ExceptionMessage);
            }
        };
        debug && console.log(Global.t() + ' Request Object: ' + JSON.stringify(object));
        return object;
    }
    , handleAction: function (action, data, type) {
        switch (action) {
            case 'toast':
                toastr[type](data);
                break;
            default:
                location.href = action;
                break;
        }
    }
    , load: function (type) {
        switch (type) {
            case 'specialities':
                service = 'ExpertGetAll';
                break;
            case 'doctors':
                service = 'DoctorsGetAll';
                break;
            case 'managers':
                service = 'ManagerGetAll';
                break;
            case 'users':
                service = 'UsersGetAll';
                break;
            case 'visits':
                service = 'VisitGetByClinic';
                break;
            case 'shifts':
                service = 'FreeTimeGetByClinicAndDate';
                break;
            case 'reservations':
                service = 'ReserveTimeGetByFreeTime';
                break;
        }
        if (typeof service !== "undefined")
            Data.post({Action: service}, 'show');
    }
    , show: function (data, tmpl, place) {
        place = (typeof place === "undefined") ? '#place' : place;
//        tmpl = (typeof tmpl === "undefined") ? data.Action : tmpl;
        tmpl = Global.loadTemplate(tmpl);
        debug && console.log(Global.t() + ' DataShow: Selected template is: ' + tmpl);
        var template = $(tmpl).html();
        var handlebarsTemplate = Handlebars.compile(template);
        var d = Data.handleItems(data.Items);
        var output = handlebarsTemplate(d);
        if ($(place).length) {
            $(place).empty();
            $(place).html(output).promise().done(function () {
                Data.handleContent(place);
            });
        }
    }
    , reload: function (page) {
        if (typeof page === "object" && page.length > 0) {
            Data.load(page[0]);
        }
    }
    , handleItems: function (items) {
        // Before render
        return items;
    }
    , handleContent: function (place) {
        // After render
        if ($(place).find("table").length) {
            $('table').bootstrapTable({locale: 'fa-IR', sortable: true, pagination: true, cache: false, pageSize: 20, clickToSelect: false});
        }
        if ($(place).find(".datepicker").length) {
            $(".datepicker").each(function () {
                var $datepicker = $(this);
                $datepicker.pDatepicker({
                    format: 'YYYY-MM-DD'
                    , onSelect: function (d, e, f) {
                        if ($datepicker.attr("data-chain").length > 1) {
                            var date = new Date(d);
//                            $("#date-input").val(date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate());
                            var $target = $($datepicker.attr("data-chain"));
//                            var greg_date = JDate.to_gregorian(date.getFullYear(), (date.getMonth() + 1), date.getDate());
                            var greg_date = date.getFullYear() + '-' + Global.zeroFill(date.getMonth() + 1) + '-' + Global.zeroFill(date.getDate());
                            $target.val(greg_date);
                        }
                    }
                });
            });
        }
    }
};
var Forms = {
    init: function () {
        $(document).on('submit', 'form', function (e) {
            var $form = Forms.validate($(this));
            var data = {
                Action: $form.attr('action')
                , Params: $form.serializeObject()
            };
            debug && console.log(Global.t() + ' Form Data: ' + JSON.stringify(data));
            Data.post(data, $form.attr('data-next'), Config.api);
            e.preventDefault();
            return false;
        });
    }
    , validate: function ($form) {
        var inputs = $form.find("input, textarea, select");
        $.each(inputs, function () {
            if ($(this).is("[required]")) {
                if (typeof $(this).val() === undefined || $(this).val() === "") {
                    $(this).parent().addClass("has-error");
                }
            }
        });
        return $form;
    }
};
var User = {
    login: function ($form) {
        var data = JSON.stringify($(this).serialize());
        Data.post(data, $form.attr('data-next'), Config.api);
    }
    , navicateSuccessLogin: function () {
        location.href = 'index.html';
    }
    , getData: function () {
        if (token !== "") {
            var guid = token.giud;
            var data = {
                Action: 'ManagerGetOne'
                , Params: {Guid: guid}
            };
            var o = Data.createObject(data);
            o.success = function (d) {
                d = (typeof d === "string") ? JSON.parse(d) : d;
                $(".user-menu .username").text(d.Items[0].Name + ' ' + d.Items[0].Famili);
            };
            $.ajax(o);
        }
    }
};

$.fn.serializeObject = function () { // serializeArray - serialize form as an array instead of default object
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};
function responsive_resize() {
    var current_width = $(window).width();
    if (current_width < 768) {
        // XS
        $('body').addClass("_xs").removeClass("_sm _md _lg");
    } else if (current_width > 767 && current_width < 992) {
        $('body').addClass("_sm").removeClass("_xs _md _lg");
    } else if (current_width > 991 && current_width < 1200) {
        $('body').addClass("_md").removeClass("_xs _sm _lg");
    } else if (current_width > 1199) {
        $('body').addClass("_lg").removeClass("_xs _sm _md");
    }
}
responsive_resize();
$(window).resize(function () { // Change width value on user resize, after DOM
    responsive_resize();
});
new app();

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});