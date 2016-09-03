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
        Global.handlebarHelpers();
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
    , post: function (data, action, service, reload) {
        var o = Data.createObject(data, service, 'post');
        var results = '';
        o.success = function (d) {
            results = d;
            d = (typeof d === "string") ? JSON.parse(d) : d;
            debug && console.log(Global.t() + ' Received Data: ' + JSON.stringify(d));
            debug && reload && console.log(Global.t() + ' Reloading Contents');
            if (d.Result !== "OK") {
                Data.handleAction('toast', d.Result, 'error');
                return false;
            }
            if (typeof reload !== "undefined" && reload === true)
                Data.reload();
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
        return results;
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
                if (xhr.status == 403)
                    User.logout();
            }
            , fail: function () {
                alert();
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
        var params = {};
        switch (type) {
            case 'specialities':
                service = 'ExpertGetAll';
                break;
            case 'doctors':
                service = 'DoctorsGetAll';
                break;
            case 'clinics':
                service = 'ClinicGetByDoctor';
                params = (typeof Location.parts[1] !== "undefined" && Location.parts[1]) ? {Params: {Guid: Location.parts[1]}} : {};
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
        if (typeof service !== "undefined") {
            
            Data.post({Action: service, Params: params}, 'show');
        }
    }
    , show: function (data, tmpl, place) {
        place = (typeof place === "undefined") ? '#place' : place;
        tmpl = Global.loadTemplate(tmpl);
        debug && console.log(Global.t() + ' DataShow: Selected template is: ' + tmpl);
        var template = $(tmpl).html();
        var handlebarsTemplate = Handlebars.compile(template);
        var d = Data.handleItems(Data.createDataFullString(Data.createDataString(data.Items)));
        var output = handlebarsTemplate(d);
        if ($(place).length) {
            $(place).empty();
            $(place).html(output).promise().done(function () {
                Data.handleContent(place);
            });
        } else {
            return output;
        }
    }
    , createDataString: function (o) {
        if (typeof o === "object") {
            $.each(o, function () {
                this.raw = JSON.stringify(this);
            });
            return o;
        }
        return null;
    }
    , createDataFullString: function (o) {
        if (o)
            o.raw = o;
        return o;
    }
    , reload: function (page) {
//        Data.handleReload();
        page = (typeof page === "object" && page.length > 0) ? page : Location.parts;
        if ($(".refresh-after").length && $("body").hasClass("modal-open")) {
            $(".refresh-after").modal('hide').on('hidden.bs.modal', function (e) {
                Data.load(page[0]);
            });
        } else {
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
            $('table').bootstrapTable({
                locale: 'fa-IR'
                , pagination: true
                , cache: false
                , pageSize: 20
                , clickToSelect: false
            });
        }
        if ($(place).find(".tree").length) {
            var data = Data.prepareTree($('.tree textarea').val());
            $('.tree').on('ready.jstree', function () {
            }).on('hover_node.jstree', function (e, node) {
//                var rawData = {
//                    ParentId: $('#' + node.node.id).parents("li:first").attr('id')
//                    , Name: $('#' + node.node.id).find("> a").text()
//                    , Id: node.node.id
//                };
//                $('#' + node.node.id).find("> a")
//                        .append('<button class="btn btn-link btn-xs manipulate" data-type="append" data-id="' + node.node.id + ' "><i class="icon-plus"></i></button>')
//                        .append('<button class="btn btn-link btn-xs manipulate" data-type="delete" data-id="' + node.node.id + ' "><i class="icon-minus"></i></button>');
            }).on('deselect_node.jstree', function (e, node) {
                $(".header-icons").find("li").attr("data-id", '').attr("data-raw", '').parent().addClass("enableby-request");
            }).on('select_node.jstree', function (e, node) {
                var rawData = {
                    ParentId: $('#' + node.node.id).parents("li:first").attr('id')
                    , Name: $('#' + node.node.id).find("> a").text()
                    , Id: node.node.id
                };
                $(".header-icons").find("li button").attr("data-id", rawData.Id).attr("data-raw", JSON.stringify(rawData)).parents("ul").removeClass("enableby-request");
            }).on('dehover_node.jstree', function (e, node) {
//                $('#' + node.node.id).find("button").remove();
            }).jstree({
                core: {
                    data: data
                }
            });
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
    , handleReload: function () {
        if ($(place).find("table").length) {
            $('table').bootstrapTable('destroy');
        }
    }
    , prepareTree: function (rawData) {
        var data = JSON.parse(rawData);
        $.each(data, function (i, item) {
            item.id = item.Id;
            item.parent = (item.ParentId === null) ? '#' : item.ParentId;
//            item.parent = item.ParentId;
            item.text = item.Name;
            item.state = {opened: true};
//            item.li_attr = {'data-id': item.Id};
            delete item.ParentId;
            delete item.Name;
            delete item.Id;
            delete item.raw;
        });
//        console.log(data);
        return data;
        return Data.treeify(data);
    }
    , treeify: function (list) {
        var treeList = [];
        var lookup = {};
        $.each(list, function (i, item) {
            lookup[item.id] = item;
            item.children = [];
        });
        $.each(list, function () {
            if (this.parent !== null) {
                lookup[this.parent]['children'].push(this);
            } else {
                treeList.push(this);
            }
        });
        $.each(treeList, function () {
            if (this.parent === null)
                this.parent = '#';
        });
        return treeList;
    }
    , createTreeOptions: function (tree) {

    }
    , addOptionPrefixes: function (id, title, level) {

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
            reload = ($form.parents(".refresh-after").length) ? true : false;
            Data.post(data, $form.attr('data-next'), Config.api, reload);
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
    , logout: function () {
        Cookie.delete();
        window.location.href = 'login.html';
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
    $(document).on('click', 'button.manipulate', function (e) {
        e.preventDefault;
        var $modal = $(".app-inner").find(".modal");
        var $form = $modal.find("form:first");
        var task = $(this).attr("data-type");
        if (task !== 'add' && task !== 'append') {
            if ($(this).parents("tr:first").find(".raw").length)
                var data = JSON.parse(JSON.parse($(this).parents("tr:first").find(".raw").val()));
            else
            if (typeof $(this).attr("data-raw") !== "undefined")
                var data = JSON.parse($(this).attr("data-raw"));
        }
        switch (task) {
            case 'append':
                var parent_id = $(this).attr('data-id');
                $modal.find('[data-identifier="parent"]').val(parent_id);
                $modal.addClass('refresh-after');
                break;
            case 'add':
                $modal.find(".modal-title").text("مورد جدید");
                $modal.find(".manipulate").hide();
                $form.trigger('reset');
                $form.find('input, textarea, select, button').prop('disabled', false);
                $modal.find('[name="Guid"]').val('');
                $form.attr('action', $form.attr('data-service-add'));
                $modal.addClass('refresh-after');
                break;
            case 'view':
                $modal.find(".modal-title").text("مشاهده جزئیات");
                $modal.find(".manipulate").show();
                for (var prop in data) {
                    if (prop === "BirthDate")
                        $modal.find('[name="BirthDatePicker"]').val(Global.convertDate(data[prop]));
                    $modal.find('[name="' + prop + '"]').val(data[prop]);
                    $form.find('input, textarea, select, button').not('[type="hidden"]').prop('disabled', true);
                }
                break;
            case 'edit':
                $modal.find(".modal-title").text("ویرایش");
                if (!$(this).parents('.modal-header').length) {
                    for (var prop in data) {
                        $modal.find('[name="' + prop + '"]').val(data[prop]);
                    }
                }
                $form.find('input, textarea, select, button').prop('disabled', false);
                $form.attr('action', $form.attr('data-service-edit'));
                $modal.addClass('refresh-after');
                break;
            case 'delete':
                var id = (typeof $(this).attr("data-id") === "undefined" && $(this).parents("tr").length) ? $(this).parents("tr").attr("data-id") : $(this).attr("data-id");
                var action = $modal.find("[data-service-delete]:first").attr("data-service-delete");
                if (confirm('Are you sure?')) {
                    var data = {
                        Action: action
                        , Params: {Guid: id, Id: id}
                    };
                    Data.post(data, $form.attr('data-next'), Config.api, true);
                }
                break;
            case 'clinics':
                var id = $(this).parents("tr:first").attr('data-id');
                var modal2 = new tingle.modal({
                    footer: true
                    , stickyFooter: false
//                    , cssClass: ['custom-class-1', 'custom-class-2']
                    , onOpen: function () {
                        console.log('modal open');
                    }
                    , onClose: function () {
                        modal2.destroy();
                    }
                });
//                 var data = 
                var o = Data.createObject({Action: 'ClinicGetByDoctor', Params: {Guid: id}});
//                console.log(o);
                o.success = function(d) {
                    var data = Data.show(d, 'ClinicGetByDoctor', 'not-available-container');
                    modal2.setContent(data);
                    modal2.open();
                }
                $.ajax(o);
                break;
        }
        if (task !== 'delete' && task !== 'clinics')
            $modal.modal('show').on('hidden.bs.modal', function () {
//                alert();
//                $('.modal-backdrop').remove();
//                $("body").removeClass('modal-open');
                if ($modal.hasClass('refresh-after'))
                    Data.reload(Location.parts);
//                    Location.refresh();
            });
    });
    $(document).on('click', 'a[data-task]', function (e) {
        var task = $(this).attr('data-task');
        e.preventDefault();
        if (task === 'logout') {
            User.logout();
        }
    });
});