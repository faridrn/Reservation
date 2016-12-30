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
    this.checkAccess = function () {
        $(function () {
            debug && console.info(Global.t() + ' Hiding menu items requiring access larger than ' + token.access + ' (' + $("[data-access]").length + ' items)');
            if ($("[data-access]").length) {
                var $items = $("[data-access]");
                $.each($items, function () {
                    if (parseInt($(this).attr("data-access")) > parseInt(token.access))
                        $(this).hide();
                });
            }
        });
    };
    var __construct = function (that) {
        debug && console.log(Global.t() + ' App started.');
        // Check Token Globally
        that.initPlugins();
        that.handleBrowser();
        that.delegateForms();
        that.checkAccess();
    }(this);
}

var Data = {
    temp: {}
    , post: function (data, action, service, reload, batch) {
        var batch = (typeof batch !== "undefined") ? batch : null;
        var postfix = (data.Action.indexOf('_') !== -1) ? data.Action.split('_')[1] : '';
        data.Action = data.Action.split('_')[0];
        var o = Data.createObject(data, service, 'post');
        var results = '';
        o.success = function (d) {
            results = d;
            debug && console.log(Global.t() + ' Received Data: ' + d);
            d = (typeof d === "string") ? JSON.parse(d) : d;
            debug && reload && console.log(Global.t() + ' Reloading Contents');
            if (d.Result !== "OK") {
                Data.handleAction('toast', d.Result, 'error');
                return false;
            }
            if (action === "toast")
                Data.handleAction('toast', d.Result, 'info');
            if (batch)
                $(document).find('[data-value="' + batch + '"]').remove();
            if (typeof reload !== "undefined" && reload === true)
                Data.reload();
            // Service Type
            switch (data.Action) {
                default:
                    if (typeof action !== "undefined" && action === 'show') {
                        Data.show(d, data.Action, '#place', postfix);
//                        console.warn(JSON.stringify(d));
                    }
                    break;
                case 'toast':
                    Data.handleAction('toast', d.Result, 'info');
                    break;
                case 'ManagerLogin':
                    token = {data: d.Items[0].Token, guid: d.Items[0].Guid, access: d.Items[0].IsAdmin};
                    Cookie.set(JSON.stringify(token));
                    User.navicateSuccessLogin();
                    break;
                case 'ManagerCreateSmsKey':
                    $("#ManagerCreateSmsKey").modal('hide');
                    $("#ManagerCreateSmsKey").on('hidden.bs.modal', function () {
                        $("#ManagerSetPassword").modal('show');
                    });
                    break;
                case 'ManagerSetPasswordBySmsKey':
                case 'ManagerSetPassword':
                    Data.handleAction('toast', d.Result, 'success');
                    $("#ManagerSetPassword").modal('hide');
                    break;
                case 'ManagerClinicRemove':
                    $(document).find('tr[data-manager-id="' + data.Params.ManagerGuid + '"]').remove();
                    break;
                case 'ManagerClinicAdd':
                    $(document).find("#manager-clinic-table tbody").append('<tr data-manager-id="' + $("select[name=ManagerGuid]").val() + '" data-clinic-id="' + data.Params.ClinicGuid + '"><td>' + $("select[name=ManagerGuid]").find("option:selected").text().split('[')[0] + '</td><td><button class="btn btn-sm btn-danger manipulate" data-type="delete-clinic-manager"><i class="icon-minus"></i> حذف</button></td></tr>');
                    break;
            }
        };
        o.error = function (jqXHR, exception) {
            var msg = '';
            var type = 'error';
            if (jqXHR.status === 0) {
                msg = 'Not connect.\n Verify Network.';
            } else if (jqXHR.status == 400) {
                msg = 'درخواست نا معتبر. [400]';
            } else if (jqXHR.status == 403) {
                msg = 'عدم مجوز اجرای دستور. [403]';
                type = 'warning';
            } else if (jqXHR.status == 500) {
                msg = 'خطا در سرور. [500]';
            } else if (jqXHR.status == 503) {
                msg = 'خطا در اجرای دستور. [503]';
            } else if (exception === 'timeout') {
                msg = 'Time out error.';
            } else if (exception === 'abort') {
                msg = 'Request aborted.';
                type = 'warning';
            } else {
                msg = 'Uncaught Error.\n' + jqXHR.responseText;
            }
            Data.handleAction('toast', msg, type);
        }
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
                params = (typeof Location.parts[1] !== "undefined" && Location.parts[1]) ? {DoctorGuid: Location.parts[1]} : {};
                break;
            case 'managers':
                service = 'ManagerGetAll';
                break;
            case 'users':
                service = 'UsersGetAll';
                break;
            case 'me':
                service = 'ManagerGetOne';
                params = {Guid: token.guid};
                break;
            case 'visits':
                if (typeof token.clinic === "undefined") {
                    alert('لطفاً مطب را انتخاب کنید');
                    Location.goBack();
                    break;
                }
                service = 'VisitGetByClinic';
                params = {ClinicGuid: token.clinic};
                break;
            case 'shifts':
                if (typeof token.clinic === "undefined") {
                    alert('لطفاً مطب را انتخاب کنید');
                    Location.goBack();
                    break;
                }
                service = 'ManagerClinicByManager_shifts';
                params = {ClinicGuid: token.clinic, ManagerGuid: token.guid};
//                delete service;
                break;
            case 'reservations':
                service = 'ReserveTimeGetByFreeTime';
                params = (typeof Location.parts[1] !== "undefined" && Location.parts[1]) ? {FreeTimeGuid: Location.parts[1]} : {};
                break;
            case 'nurses':
                service = 'DirectRequestGetAll';
//                params = (typeof Location.parts[1] !== "undefined" && Location.parts[1]) ? {FreeTimeGuid: Location.parts[1]} : {};
                break;
        }
        if (typeof service !== "undefined") {
            Data.post({Action: service, Params: params}, 'show');
        }
    }
    , show: function (data, tmpl, place, postfix) {
        tmpl = (postfix) ? tmpl + '_' + postfix : tmpl;
        tmpl = Global.loadTemplate(tmpl);
        debug && console.log(Global.t() + ' DataShow: Selected template is: ' + tmpl);
        var template = $(tmpl).html();
        var handlebarsTemplate = Handlebars.compile(template);
        var d = Data.handleItems(Data.createDataString(data));
        var output = handlebarsTemplate(d);
        place = (typeof place === "undefined") ? '#place' : place;
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
            $.each(o.Items, function () {
                this.raw = JSON.stringify(this);
            });
            return o.Items;
        } else if (typeof o === "string") {
            var ob = JSON.parse(o);
            $.each(ob.Items, function () {
                this.raw = JSON.stringify(this);
            });
            return ob.Items;
        } else {
            return o;
        }
        return null;
    }
    , reload: function (page) {
        page = (typeof page === "object" && page.length > 0) ? page : Location.parts;
        if ($(".refresh-after").length && $("body").hasClass("modal-open")) {
            $(".refresh-after").modal('hide').on('hidden.bs.modal', function (e) {
                Data.load(page[0]);
            });
        } else {
            Data.load(page[0]);
        }
    }
    , handleItems: function (items) { // Before render
        return items;
    }
    , handleContent: function (place) { // After render
        if ($(place).find(".table").length) {
            var $table = ($("#place-inner").length) ? $("#place-inner").find('.table') : $("#place").find(".table");
            $table.bootstrapTable({
                locale: 'fa-IR'
                , pagination: true
                , cache: false
                , pageSize: 20
                , clickToSelect: false
            });
        } else {
            if (Location.parts[0] === "shifts") {
                // Temp: Until I find a better solution! like checking if the datepicker is compeletely initialized
                window.setTimeout(function () {
                    $(".show-records").length && $(".show-records").trigger('click');
                }, 1000);
            }
        }
        if ($(place).find(".tree").length) {
            var data = Data.prepareTree($('.tree textarea').val());
            $('.tree').on('ready.jstree', function () {
            }).on('hover_node.jstree', function (e, node) {
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
            $(".datepicker:not(:disabled)").each(function () {
                window.formatPersian = false;
                var $datepicker = $(this);
                var offset = (typeof $datepicker.attr("data-offset") !== "undefined") ? persianDate().add('d', 7).format('YYYY-MM-DD') : persianDate().format('YYYY-MM-DD');
                offset = offset.split('-').toInt();
                $datepicker.pDatepicker({
                    format: 'YYYY-MM-DD'
                    , onSelect: function (d, e, f) {
                        var date = $datepicker.val();
                        $datepicker.parent().find(".input-group-addon").html(persianDate(date.split('-').toInt()).format('dddd'));
                        if (typeof $datepicker.attr("data-chain") !== "undefined" && $datepicker.attr("data-chain").length > 1) {
                            var $target = $($datepicker.attr("data-chain"));
                            $target.val(Global.convertDate2Gregorian(date, '-'));
                        }
                    }
                });
                $datepicker.pDatepicker('setDate', offset);
                if ($datepicker.parent().find(".input-group-addon").length) {
                    var $addon = $datepicker.parent().find(".input-group-addon");
                    $addon.html(persianDate(offset).format('dddd'));
                }
            });
        }
        if ($(place).find(".datetimepicker").length) {
            $(".datetimepicker:not(:disabled)").each(function () {
                var $datepicker = $(this);
                $datepicker.pDatepicker({
                    format: 'YYYY-MM-DD H:m'
                    , timePicker: {
                        enabled: true
                        , showSeconds: false
//                        , showMeridian: false
                    }
                    , onSelect: function (d, e, f) {
                        if ($datepicker.attr("data-chain").length > 1) {
                            var $target = $($datepicker.attr("data-chain"));
                            var datetime = $datepicker.val().split(' ');
                            var date = datetime[0].split('-');
                            var JDate = require('jdate');
                            var gdate = JDate.to_gregorian(parseInt(date[0]), parseInt(date[1]), parseInt(date[2]));
                            var greg_date = gdate.getFullYear() + '-' + Global.zeroFill(gdate.getMonth() + 1) + '-' + Global.zeroFill(gdate.getDate());
                            $target.val(greg_date + ' ' + datetime[1] + ':00');
                        }
                    }
                });
            });
        }
        if ($(place).find(".timepicker").length) {
            $(".timepicker:not(:disabled)").each(function () {
                var $timepicker = $(this);
                $timepicker.pDatepicker({
                    format: 'H:m'
                    , timePicker: {
                        enabled: true
                        , showSeconds: false
                    }
                    , onlyTimePicker: true
                    , onSelect: function (d, e, f) {
                        if ($timepicker.attr("data-chain").length > 1) {
                            var $target = $($timepicker.attr("data-chain"));
                            $target.val($timepicker.val());
                        }
                    }
                });
            });
        }
        if ($(place).find(".open-datepicker").length) {
            $(".open-datepicker:not(:disabled)").each(function () {
                var $datepicker = $(this);
                $datepicker.pDatepicker({
                    format: 'H:m'
                    , timePicker: {
                        enabled: false
                    }
                    , toolbox: {
                        enabled: false
                    }
                    , onSelect: function (d) {
                        var date = persianDate.unix(d / 1000);
                        var formattedDate = date.format('dddd DD MMMM YYYY');
                        date.formatPersian = false;
                        var usableDate = date.format('YYYY-MM-DD').split('-');
                        var JDate = require('jdate');
                        var gdate = JDate.to_gregorian(parseInt(usableDate[0]), parseInt(usableDate[1]), parseInt(usableDate[2]));
                        var greg_date = gdate.getFullYear() + '-' + Global.zeroFill(gdate.getMonth() + 1) + '-' + Global.zeroFill(gdate.getDate());
                        if (!$(".datelist ul").find("input[value=" + greg_date + "]").length)
                            $(".datelist ul").append('<li data-value="' + greg_date + '"><a href="#" class="btn btn-sm btn-xs">&times;</a>' + formattedDate + '</li>');
                    }
                });
            });
            $(document).on('click', ".datelist ul a", function (e) {
                e.preventDefault();
                $(this).parent().remove();
            });
        }
        if ($(".get-url").length) {
            $(".get-url").each(function () {
                var part = parseInt($(this).attr("data-part"));
                if (typeof Location.parts[part] !== "undefined" && Location.parts[part] !== "")
                    $(this).val(Location.parts[part]);
            });
        }
        if ($(".load-data").length) {
            $.each($(".load-data"), function () {
                var $handler = $(this);
                if ($handler.html().length === 0) {
                    var params = JSON.parse($handler.attr("data-params"));
                    if (typeof params.ClinicGuid !== "undefined")
                        params.ClinicGuid = token.clinic.toString();
                    if (typeof params.ManagerGuid !== "undefined")
                        params.ManagerGuid = token.guid.toString();
                    var o = Data.createObject({Action: $handler.attr("data-service"), Params: params});
                    o.success = function (d) {
                        var data = Data.show(d, $handler.attr("data-template"), '#' + $handler.attr("id"));
                    };
                    $.ajax(o);
                }
            });
        }
        if ($("select.form-control").length) {
            $.each($("select.form-control"), function () {
                if (!$(this).hasClass("simple")) {
                    $(this).select2({
                        width: '100%'
                    });
                }
            });
        }
        if ($("form.standalone.image-upload").length) {
            $("form.standalone.image-upload").attr('action', Config.upload);
        }
    }
    , handleReload: function () {
        if ($(place).find("table").length) {
            $('table').bootstrapTable('destroy');
        }
    }
    , prepareTree: function (rawData) {
        var data = (typeof rawData === "string") ? JSON.parse(rawData) : rawData;
        $.each(data, function (i, item) {
            item.id = parseInt(item.Id);
            item.parent = (item.ParentId === null) ? '#' : parseInt(item.ParentId);
            item.text = item.Name;
            item.state = {opened: true};
            item.children = [];
            item.depth = 0;
            delete item.ParentId;
            delete item.Name;
            delete item.Id;
            delete item.raw;
        });
        return Data.treeify(data);
        return data;
    }
    , treeify: function (list) {
        cache.tree = '';
        cache.imagine = $('<div><div class="hierarchy-0"></div></div>');
        Data.createTree(Global.cloneObject(list));
        Data.findChildren(cache.imagine.find('.hierarchy-0'), 0)
        cache.tree = ('<select name="ExpertId" class="form-control simple rtl no-edit">' + cache.tree + '</select>');
        return list;
    }
    , createTree: function (items) {
        $.each(items, function (i, item) {
            item.parent = (item.parent === "#") ? 0 : item.parent;
            var parent = cache.imagine.find('.hierarchy-' + item.parent);
            parent.append('<div class="hierarchy-' + item.id + '"><span>' + item.text + '</span></div>');
        });
    }
    , findChildren: function (elem, indent) {
        elem.children('div').each(function (c, child) {
            cache.tree += '<option value="' + $(child).attr("class").split("-")[1] + '">' + '| - - '.repeat(indent) + $(child).children('span').text() + '</option>';
            Data.findChildren($(child), indent + 1);
        });
    }
};
var Forms = {
    init: function () {
        $(document).on('submit', 'form:not(.standalone)', function (e) {
            if ($(this).hasClass("batch")) {
                Forms.processBatch($(this));
                return false;
            }
            var $form = Forms.validate($(this));
            var data = {
                Action: $form.attr('action')
                , Params: $form.serializeObject()
            };
            debug && console.log(Global.t() + ' Form Data: ' + JSON.stringify(data));
            reload = ($form.parents(".refresh-after").length) ? true : false;
            Data.post(data, $form.attr('data-next'), Config.api, reload);
            if (typeof $form.attr("action") !== "undefined" && $form.attr("action") === "ManagerClinicAdd") {

            }
            e.preventDefault();
            return false;
        });
        $(document).on('submit', "form.image-upload", function (e) {
            var filename = $(this).find('input[type=file]').val().split('\\').pop();
            var FileName = filename.split('.')[0];
            var FileExtension = filename.split('.')[1];
            $(this).ajaxSubmit({
                headers: {
                    FileName: FileName
                    , FileExtension: FileExtension
                }
                , success: function (d) {
                    var restult = (typeof d === "object") ? d : JSON.parse(d);
                    $(document).find("input[name=ImageAddress]").val(Config.media + restult.Result);
                    $(document).find(".item-picture img").attr('src', Config.media + restult.Result);
                }
            });
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
    , processBatch: function ($form) {
        if ($form.attr('action') === "FreeTimeAdd") {
            if (!$(".datelist ul li").length)
                return false;
            var data = {
                Action: $form.attr('action')
                , Params: $form.serializeObject()
            };
            var start = data.Params.StartTime;
            var end = data.Params.EndTime;
            $(".datelist ul li").each(function () {
                data.Params.StartTime = $(this).attr('data-value') + ' ' + start + ':00';
                data.Params.EndTime = $(this).attr('data-value') + ' ' + end + ':00';

                debug && console.log(Global.t() + ' Form Data: ' + JSON.stringify(data));
                var results = Data.post(data, 'toast', Config.api, false, $(this).attr('data-value'));
            });
        }
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
            var guid = token.guid;
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

$(window).resize(function () { // Change width value on user resize, after DOM
    responsive_resize();
});
new app();
$(function () {
    responsive_resize();
    $('[data-toggle="tooltip"]').tooltip();
    $(document).on('click', 'button.manipulate', function (e) {
        e.preventDefault;
        var $modal = $(".app-inner").find(".modal:first");
        var $form = $modal.find("form").not(".standalone");
        var task = $(this).attr("data-type");
        if (task !== 'add' && task !== 'append') {
            if ($(this).parents("tr:first").find(".raw").length) {
                var rawData = JSON.parse($(this).parents("tr:first").find(".raw").val());
                var data = (typeof rawData === "object") ? rawData : JSON.parse(rawData);
            } else
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
                $form.find("[name=ClinicGuid]").val(token.clinic);
                break;
            case 'add-monthly':
                $modal = $("#monthly-add");
                $form = $modal.find("form");
                $form.trigger('reset');
                $form.find('input, textarea, select, button').prop('disabled', false);
                $modal.find('[name="Guid"]').val('');
                $form.attr('action', $form.attr('data-service-add'));
                $modal.addClass('refresh-after');
                $form.find("[name=ClinicGuid]").val(token.clinic);
                break;
            case 'change-pass':
                $form.find('input, textarea, select, button').prop('disabled', false);
                $modal.addClass('refresh-after');
                break;
            case 'view':
                $modal.find(".modal-title").text("مشاهده جزئیات");
                $modal.find(".manipulate").show();
                for (var prop in data) {
                    if (prop === "BirthDate")
                        $modal.find('[name="BirthDatePicker"]').val(Global.convertDate(data[prop]));
                    if (prop === "StartTime") {
                        var dateArr = Global.convertDateTime(data[prop]).split(/[\s\-\:]+/);
                        if (typeof dateArr[dateArr.length - 1] === "string") {
                            dateArr[dateArr.length - 1].indexOf('ب') !== -1 && (dateArr[dateArr.length - 4] = parseInt(dateArr[dateArr.length - 4]) + 12);
                            dateArr.pop();
                        }
                        dateArr = dateArr.toInt()
//                        console.info(dateArr)
                        $modal.find('[name="StartTimePicker"]').pDatepicker('setDate', dateArr);
                        $modal.find('[name="StartTime"]').val(Global.convertDateTime(data[prop]));
                    }
                    if (prop === "EndTime") {
                        var dateArr = Global.convertDateTime(data[prop]).split(/[\s\-\:]+/);
                        if (typeof dateArr[dateArr.length - 1] === "string") {
                            dateArr[dateArr.length - 1].indexOf('ب') !== -1 && (dateArr[dateArr.length - 4] = parseInt(dateArr[dateArr.length - 4]) + 12);
                            dateArr.pop();
                        }
                        dateArr = dateArr.toInt()
                        $modal.find('[name="EndTimePicker"]').pDatepicker('setDate', dateArr);
                        $modal.find('[name="EndTime"]').val(Global.convertDateTime(data[prop]));
                    }
                    $modal.find('[name="' + prop + '"]').val(data[prop]);
                    $form.find('input, textarea, select, button').not('[type="hidden"]').prop('disabled', true);
                    if (prop === "ImageAddress") {
                        var img = (data[prop] !== null && data[prop].indexOf('//') !== -1) ? data[prop] : Config.media + data[prop];
                        $modal.find(".item-picture img:first").attr('src', img);
                    }
                }
                break;
            case 'edit':
                $modal.find(".modal-title").text("ویرایش");
                if (!$(this).parents('.modal-header').length) {
                    for (var prop in data) {
                        $modal.find('[name="' + prop + '"]').val(data[prop]);
                    }
                }
                $form.find('input, textarea, select, button').not(".no-edit").prop('disabled', false);
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
            case 'delete-clinic-manager':
                var $row = $(this).parents("tr:first");
                if (confirm('Are you sure?')) {
                    var data = {
                        Action: 'ManagerClinicRemove'
                        , Params: {
                            ManagerGuid: $row.attr("data-manager-id")
                            , ClinicGuid: $row.attr("data-clinic-id")
                        }
                    };
                    Data.post(data, $form.attr('data-next'), Config.api, false);
                }
                break;
            case 'assign':
                var id = $(this).parents("tr:first").attr("data-id");
                var o = Data.createObject({Action: 'ManagerClinicByClinic', Params: {ClinicGuid: id}});
                o.success = function (d) {
                    var data = Data.show(d, 'ManagerClinicByClinic', 'not-available-container');
                    $("#clinic-manage").find(".modal-body").html(data);
                    $("#clinic-manage").modal({backdrop: "static"}).on('shown.bs.modal', function () {
                        $("input[name=ClinicGuid]").val(id);
                    }).on('hidden.bs.modal', function () {
                        Data.reload(Location.parts);
                    });
                }
                $.ajax(o);
                break;
            case 'setState':
                var id = (typeof $(this).attr("data-id") === "undefined" && $(this).parents("tr").length) ? $(this).parents("tr").attr("data-id") : $(this).attr("data-id");
                var state = $(this).attr("data-state");
                var action = $modal.find("[data-service-update]:first").attr("data-service-update");
                if (confirm('Are you sure?')) {
                    var data = {
                        Action: action
                        , Params: {Id: id, Guid: id, State: state}
                    };
                    Data.post(data, 'toast', Config.api, true);
                }
                break;
        }
        if (task !== 'delete' && task !== 'assign' && task !== 'delete-clinic-manager' && task !== 'setState')
            $modal.modal({backdrop: 'static'}).on('hidden.bs.modal', function () {
                if ($modal.hasClass('refresh-after'))
                    Data.reload(Location.parts);
            });
    });
    $(document).on('click', 'a[data-task]', function (e) {
        var task = $(this).attr('data-task');
        e.preventDefault();
        switch (task) {
            case 'logout':
                User.logout();
                break;
            case 'next-modal':
                var $current = $(this).parents(".modal");
                var $next = $($(this).attr('data-target'));
                $current.modal('hide');
                $current.on('hidden.bs.modal', function () {
                    $next.modal('show');
                });
                break;
            case 'toggle-menu':
                var $target = $(document).find($(this).attr("data-target"));
                if ($target.hasClass('open'))
                    $target.animate({'height': '150px'}).removeClass('open');
                else
                    $target.animate({'height': '100%'}).addClass('open');
                break;
        }
    });
    $(document).on('click', "#menu li a", function (e) {
        if ($(this).parents(".sidebar").hasClass("open") && ($("body").hasClass('_xs') || $("body").hasClass('_sm'))) {
            $(this).parents(".sidebar").animate({'height': '150px'}).removeClass('open');
        }
    });
    $(document).on('change', "#form-upload", function () {
        $(this).parents("form:first").submit();
    });
});

String.prototype.toEnglishDigits = function () {
    var charCodeZero = '۰'.charCodeAt(0);
    return parseInt(this.replace(/[۰-۹]/g, function (w) {
        return w.charCodeAt(0) - charCodeZero;
    }));
};
Array.prototype.toEnglishDigits = function () {
    var that = this;
    for (var i = 0; i < that.length; i++)
        that[i] = that[i].toEnglishDigits();
    return that;
};
String.prototype.toInt = function () {
    return parseInt(this);
};
Array.prototype.toInt = function () {
    var that = this;
    for (var i = 0; i < that.length; i++)
        that[i] = (typeof that[i] === "string") ? that[i].toInt() : that[i];
    return that;
};