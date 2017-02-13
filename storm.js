/*
 * October JavaScript foundation library.
 * 
 * Base class for OctoberCMS back-end classes.
 *
 * The class defines base functionality for dealing with memory management
 * and cleaning up bound (proxied) methods.
 *
 * The base class defines the dispose method that cleans up proxied methods. 
 * If child classes implement their own dispose() method, they should call 
 * the base class dispose method (see the example below).
 *
 * Use the simple parasitic combination inheritance pattern to create child classes:
 * 
 * var Base = Storm.foundation.base,
 *     BaseProto = Base.prototype
 *
 * var SubClass = function(params) {
 *     // Call the parent constructor
 *     Base.call(this)
 * }
 *
 * SubClass.prototype = Object.create(BaseProto)
 * SubClass.prototype.constructor = SubClass
 *
 * // Child class methods can be defined only after the 
 * // prototype is updated in the two previous lines
 *
 * SubClass.prototype.dispose = function() {
 *     // Call the parent method
 *     BaseProto.dispose.call(this)
 * };
 *
 * See: 
 *
 * - https://developers.google.com/speed/articles/optimizing-javascript
 * - http://javascriptissexy.com/oop-in-javascript-what-you-need-to-know/
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript
 *
 */
+function ($) {
    "use strict";
    if (window.Storm === undefined)
        window.Storm = {};

    if (Storm.foundation === undefined)
        Storm.foundation = {};

    Storm.foundation._proxyCounter = 0;

    var Base = function () {
        this.proxiedMethods = {}
    };

    Base.prototype.dispose = function () {
        for (var key in this.proxiedMethods) {
            this.proxiedMethods[key] = null
        }

        this.proxiedMethods = null
    };

    /*
     * Creates a proxied method reference or returns an existing proxied method.
     */
    Base.prototype.proxy = function (method) {
        if (method.ocProxyId === undefined) {
            Storm.foundation._proxyCounter++;
            method.ocProxyId = Storm.foundation._proxyCounter
        }

        if (this.proxiedMethods[method.ocProxyId] !== undefined)
            return this.proxiedMethods[method.ocProxyId];

        this.proxiedMethods[method.ocProxyId] = method.bind(this);
        return this.proxiedMethods[method.ocProxyId]
    };

    Storm.foundation.base = Base;
}(window.jQuery);
/*
 * October JavaScript foundation library.
 * 
 * Light-weight utility functions for working with DOM elements. The functions
 * work with elements directly, without jQuery, using the native JavaScript and DOM
 * features.
 *
 * Usage examples:
 *
 * Storm.foundation.element.addClass(myElement, myClass)
 *
 */
+function ($) {
    "use strict";
    if (window.Storm === undefined) {
        window.Storm = {};
    }

    if (Storm.foundation === undefined)
        Storm.foundation = {};

    var Element = {
        hasClass: function (el, className) {
            if (el.classList)
                return el.classList.contains(className);

            return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
        },

        addClass: function (el, className) {
            var classes = className.split(' ');

            for (var i = 0, len = classes.length; i < len; i++) {
                var currentClass = classes[i].trim();

                if (this.hasClass(el, currentClass))
                    return;

                if (el.classList)
                    el.classList.add(currentClass);
                else
                    el.className += ' ' + currentClass;
            }
        },

        removeClass: function (el, className) {
            if (el.classList)
                el.classList.remove(className);
            else
                el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        },

        toggleClass: function (el, className, add) {
            if (add === undefined) {
                if (this.hasClass(el, className)) {
                    this.removeClass(el, className)
                }
                else {
                    this.addClass(el, className)
                }
            }

            if (add && !this.hasClass(el, className)) {
                this.addClass(el, className);
                return
            }

            if (!add && this.hasClass(el, className)) {
                this.removeClass(el, className);

            }
        },

        /*
         * Returns element absolution position.
         * If the second parameter value is false, the scrolling
         * won't be added to the result (which could improve the performance).
         */
        absolutePosition: function (element, ignoreScrolling) {
            var top = ignoreScrolling === true ? 0 : document.body.scrollTop,
                left = 0;

            do {
                top += element.offsetTop || 0;

                if (ignoreScrolling !== true)
                    top -= element.scrollTop || 0;

                left += element.offsetLeft || 0;
                element = element.offsetParent
            } while (element);

            return {
                top: top,
                left: left
            }
        },

        getCaretPosition: function (input) {
            if (document.selection) {
                var selection = document.selection.createRange();

                selection.moveStart('character', -input.value.length);
                return selection.text.length
            }

            if (input.selectionStart !== undefined)
                return input.selectionStart;

            return 0
        },

        setCaretPosition: function (input, position) {
            if (document.selection) {
                var range = input.createTextRange();

                setTimeout(function () {
                    // Asynchronous layout update, better performance
                    range.collapse(true);
                    range.moveStart("character", position);
                    range.moveEnd("character", 0);
                    range.select();
                    range = null;
                    input = null
                }, 0)
            }

            if (input.selectionStart !== undefined) {
                setTimeout(function () {
                    // Asynchronous layout update
                    input.selectionStart = position;
                    input.selectionEnd = position;
                    input = null
                }, 0)
            }
        },

        elementContainsPoint: function (element, point) {
            var elementPosition = Storm.foundation.element.absolutePosition(element),
                elementRight = elementPosition.left + element.offsetWidth,
                elementBottom = elementPosition.top + element.offsetHeight;

            return point.x >= elementPosition.left && point.x <= elementRight
                && point.y >= elementPosition.top && point.y <= elementBottom
        }
    };

    Storm.foundation.element = Element;
}(window.jQuery);
/*
 * October JavaScript foundation library.
 * 
 * Light-weight utility functions for working with native DOM events. The functions
 * work with events directly, without jQuery, using the native JavaScript and DOM
 * features.
 *
 * Usage examples:
 *
 * Storm.foundation.event.stop(ev)
 *
 */
+function ($) {
    "use strict";
    if (window.Storm === undefined) {
        window.Storm = {};
    }

    if (Storm.foundation === undefined)
        Storm.foundation = {};

    var Event = {
        /*
         * Returns the event target element.
         * If the second argument is provided (string), the function
         * will try to find the first parent with the tag name matching
         * the argument value.
         */
        getTarget: function (ev, tag) {
            var target = ev.target ? ev.target : ev.srcElement;

            if (tag === undefined)
                return target;

            var tagName = target.tagName;

            while (tagName != tag) {
                target = target.parentNode;

                if (!target)
                    return null;

                tagName = target.tagName
            }

            return target
        },

        stop: function (ev) {
            if (ev.stopPropagation)
                ev.stopPropagation();
            else
                ev.cancelBubble = true;

            if (ev.preventDefault)
                ev.preventDefault();
            else
                ev.returnValue = false
        },

        pageCoordinates: function (ev) {
            if (ev.pageX || ev.pageY) {
                return {
                    x: ev.pageX,
                    y: ev.pageY
                }
            }
            else if (ev.clientX || ev.clientY) {
                return {
                    x: (ev.clientX + document.body.scrollLeft + document.documentElement.scrollLeft),
                    y: (ev.clientY + document.body.scrollTop + document.documentElement.scrollTop)
                }
            }

            return {
                x: 0,
                y: 0
            }
        }
    };

    Storm.foundation.event = Event;
}(window.jQuery);
/*
 * October JavaScript foundation library.
 * 
 * Utility functions for working back-end client-side UI controls.
 *
 * Usage examples:
 *
 * Storm.foundation.controlUtils.markDisposable(el)
 * Storm.foundation.controlUtils.disposeControls(container)
 *
 */
+function ($) {
    "use strict";
    if (window.Storm === undefined) {
        window.Storm = {};
    }

    if (Storm.foundation === undefined)
        Storm.foundation = {};

    var ControlUtils = {
        markDisposable: function (el) {
            el.setAttribute('data-disposable', '')
        },

        /*
         * Destroys all disposable controls in a container.
         * The disposable controls should watch the dispose-control 
         * event.
         */
        disposeControls: function (container) {
            var controls = container.querySelectorAll('[data-disposable]');

            for (var i = 0, len = controls.length; i < len; i++)
                $(controls[i]).triggerHandler('dispose-control')

            if (container.hasAttribute('data-disposable'))
                $(container).triggerHandler('dispose-control')
        }
    };

    Storm.foundation.controlUtils = ControlUtils;

    $(document).on('ajaxBeforeReplace', function (ev) {
        // Automatically dispose controls in an element
        // before the element contents is replaced.
        // The ajaxBeforeReplace event is triggered in 
        // framework.js

        Storm.foundation.controlUtils.disposeControls(ev.target)
    })
}(window.jQuery);
/*
 * The flash message.
 *
 * Documentation: ../docs/flashmessage.md
 *
 * Require:
 *  - bootstrap/transition
 */
+function ($) {
    "use strict";

    var FlashMessage = function (options, el) {
        var $element = $(el);

        options = $.extend({}, FlashMessage.DEFAULTS, typeof options === 'string' ? {text: options} : options);

        $('body > p.flash-message').remove();

        if ($element.length == 0) {
            $element = $('<p />').addClass(options.class).html(options.text)
        }

        $element.addClass('flash-message fade');
        $element.attr('data-control', null);
        $element.append('<button type="button" class="close" aria-hidden="true">&times;</button>');
        $element.on('click', 'button', remove);
        $element.on('click', remove);

        $(document.body).append($element);

        setTimeout(function () {
            $element.addClass('in')
        }, 100);

        var timer = window.setTimeout(remove, options.interval * 1000);

        function removeElement() {
            $element.remove()
        }

        function remove() {
            window.clearInterval(timer);

            $element.removeClass('in');
            $.support.transition && $element.hasClass('fade')
                ? $element
                    .one($.support.transition.end, removeElement)
                    .emulateTransitionEnd(500)
                : removeElement()
        }
    };

    FlashMessage.DEFAULTS = {
        class: 'success',
        text: 'Default text',
        interval: 5
    };

    // FLASH MESSAGE PLUGIN DEFINITION
    // ============================

    if (window.Storm === undefined) {
        window.Storm = {};
    }

    Storm.flashMsg = FlashMessage;

    // FLASH MESSAGE DATA-API
    // ===============

    $(document).on('render', function () {
        $('[data-control=flash-message]').each(function () {
            Storm.flashMsg($(this).data(), this)
        })
    })

}(window.jQuery);

/*
 * Checkbox control
 *
 */

(function ($) {

    $(document).on('keydown', 'div.custom-checkbox', function (e) {
        if (e.keyCode == 32)
            e.preventDefault()
    });

    $(document).on('keyup', 'div.custom-checkbox', function (e) {
        if (e.keyCode == 32) {
            var $cb = $('input', this);

            if ($cb.data('oc-space-timestamp') == e.timeStamp)
                return;

            $cb.get(0).checked = !$cb.get(0).checked;
            $cb.data('oc-space-timestamp', e.timeStamp);
            $cb.trigger('change');
            return false
        }
    });

    //
    // Intermediate checkboxes
    //

    $(document).on('render', function () {
        $('div.custom-checkbox.is-indeterminate > input').each(function () {
            var $el = $(this),
                checked = $el.data('checked');

            switch (checked) {

                // Unchecked
                case 1:
                    $el.prop('indeterminate', true);
                    break;

                // Checked
                case 2:
                    $el.prop('indeterminate', false);
                    $el.prop('checked', true);
                    break;

                // Unchecked
                default:
                    $el.prop('indeterminate', false);
                    $el.prop('checked', false)
            }
        })
    });

    $(document).on('click', 'div.custom-checkbox.is-indeterminate > label', function () {
        var $el = $(this).parent().find('input:first'),
            checked = $el.data('checked');

        if (checked === undefined) {
            checked = $el.is(':checked') ? 1 : 0
        }

        switch (checked) {

            // Unchecked, going indeterminate
            case 0:
                $el.data('checked', 1);
                $el.prop('indeterminate', true);
                break;

            // Indeterminate, going checked
            case 1:
                $el.data('checked', 2);
                $el.prop('indeterminate', false);
                $el.prop('checked', true);
                break;

            // Checked, going unchecked
            default:
                $el.data('checked', 0);
                $el.prop('indeterminate', false);
                $el.prop('checked', false)
        }

        $el.trigger('change');
        return false
    })

})(jQuery);
/*
 * Balloon selector control. 
 *
 * Data attributes:
 * - data-control="balloon-selector" - enables the plugin
 *
 */
+function ($) {
    "use strict";

    var BalloonSelector = function (element, options) {

        this.$el = $(element);
        this.$field = $('input', this.$el);

        this.options = options || {};

        var self = this;
        $('li', this.$el).click(function () {
            if (self.$el.hasClass('control-disabled'))
                return;

            $('li', self.$el).removeClass('active');
            $(this).addClass('active');
            self.$field.val($(this).data('value'));
            self.$el.trigger('change')
        })
    };

    BalloonSelector.DEFAULTS = {};

    // BALLOON SELECTOR PLUGIN DEFINITION
    // ===================================

    var old = $.fn.balloonSelector;

    $.fn.balloonSelector = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.balloon-selector');
            var options = $.extend({}, BalloonSelector.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('oc.balloon-selector', (data = new BalloonSelector(this, options)))
        })
    };

    $.fn.balloonSelector.Constructor = BalloonSelector;

    // BALLOON SELECTOR NO CONFLICT
    // ===================================

    $.fn.balloonSelector.noConflict = function () {
        $.fn.balloonSelector = old;
        return this
    };

    // BALLOON SELECTOR DATA-API
    // ===================================

    $(document).on('render', function () {
        $('div[data-control=balloon-selector]').balloonSelector()
    })

}(window.jQuery);
/*
 * Dropdown menus.
 *
 * This script customizes the Twitter Bootstrap drop-downs.
 *
 * Require:
 *  - bootstrap/dropdown
 */
+function ($) {
    "use strict";

    $(document).on('shown.bs.dropdown', '.custom-dropdown', function (event, relatedTarget) {
        $(document.body).addClass('dropdown-open');

        var dropdown = (relatedTarget? relatedTarget: $(event.relatedTarget)).siblings('.dropdown-menu'),
            dropdownContainer = $(this).data('dropdown-container');

        // The dropdown menu should be a sibling of the triggering element (above)
        // otherwise, look for any dropdown menu within this context.
        if (dropdown.length === 0) {
            dropdown = $('.dropdown-menu', this)
        }

        if ($('.dropdown-container', dropdown).length == 0) {

            var title = $('[data-toggle=dropdown]', this).text(),
                titleAttr = dropdown.data('dropdown-title'),
                timer = null;

            if (titleAttr !== undefined)
                title = titleAttr;

            $('li:first-child', dropdown).addClass('first-item');
            $('li:last-child', dropdown).addClass('last-item');

            dropdown.prepend($('<li />').addClass('dropdown-title').text(title));

            var container = $('<li />').addClass('dropdown-container'),
                ul = $('<ul />');

            container.prepend(ul);
            ul.prepend(dropdown.children());
            dropdown.prepend(container);

            dropdown.on('touchstart', function () {
                window.setTimeout(function () {
                    dropdown.addClass('scroll')
                }, 200)
            });

            dropdown.on('touchend', function () {
                window.setTimeout(function () {
                    dropdown.removeClass('scroll')
                }, 200)
            });

            dropdown.on('click', 'a', function () {
                if (dropdown.hasClass('scroll'))
                    return false
            })
        }

        if (dropdownContainer !== undefined && dropdownContainer == 'body') {
            $(this).data('oc.dropdown', dropdown);
            $(document.body).append(dropdown);

            dropdown.css({
                'visibility': 'hidden',
                'left': 0,
                'top': 0,
                'display': 'block'
            });

            var targetOffset = $(this).offset(),
                targetHeight = $(this).height(),
                targetWidth = $(this).width(),
                position = {
                    x: targetOffset.left,
                    y: targetOffset.top + targetHeight
                },
                leftOffset = targetWidth < 30 ? -16 : 0,
                documentHeight = $(document).height(),
                dropdownHeight = dropdown.height();

            if ((dropdownHeight + position.y) > $(document).height()) {
                position.y = targetOffset.top - dropdownHeight - 12;
                dropdown.addClass('top')
            }
            else {
                dropdown.removeClass('top')
            }

            dropdown.css({
                'left': position.x + leftOffset,
                'top': position.y,
                'visibility': 'visible'
            })
        }

        if ($('.dropdown-overlay', document.body).length == 0) {
            $(document.body).prepend($('<div/>').addClass('dropdown-overlay'));
        }
    });

    $(document).on('hidden.bs.dropdown', '.custom-dropdown', function () {
        var dropdown = $(this).data('oc.dropdown');
        if (dropdown !== undefined) {
            dropdown.css('display', 'none');
            $(this).append(dropdown)
        }

        $(document.body).removeClass('dropdown-open');
    });

    /*
     * Fixed positioned dropdowns
     * - Useful for dropdowns inside hidden overflow containers
     */

    var $dropdown, $container, $target;

    function fixDropdownPosition() {
        var position = $container.offset();

        $dropdown.css({
            position: 'fixed',
            top: position.top - 1 - $(window).scrollTop() + $target.outerHeight(),
            left: position.left
        })
    }

    $(document).on('shown.bs.dropdown', '.custom-dropdown.dropdown-fixed', function (event, eventData) {
        $container = $(this);
        $dropdown = $('.dropdown-menu', $container);
        $target = $(eventData.relatedTarget);
        fixDropdownPosition();

        $(window).on('scroll.oc.dropdown, resize.oc.dropdown', fixDropdownPosition)
    });

    $(document).on('hidden.bs.dropdown', '.custom-dropdown.dropdown-fixed', function () {
        $(window).off('scroll.oc.dropdown, resize.oc.dropdown', fixDropdownPosition)
    })

}(window.jQuery);
/*
 * Callout
 *
 * - Documentation: ../docs/callout.md
 */
+function ($) {
    'use strict';

    // CALLOUT CLASS DEFINITION
    // ======================

    var dismiss = '[data-dismiss="callout"]';
    var Callout = function (el) {
        $(el).on('click', dismiss, this.close)
    };

    Callout.prototype.close = function (e) {
        var $this = $(this);
        var selector = $this.attr('data-target');

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
        }

        var $parent = $(selector);

        if (e) e.preventDefault();

        if (!$parent.length) {
            $parent = $this.hasClass('callout') ? $this : $this.parent()
        }

        $parent.trigger(e = $.Event('close.oc.callout'));

        if (e.isDefaultPrevented()) return;

        $parent.removeClass('in');

        function removeElement() {
            $parent.trigger('closed.oc.callout').remove()
        }

        $.support.transition && $parent.hasClass('fade')
            ? $parent
                .one($.support.transition.end, removeElement)
                .emulateTransitionEnd(500)
            : removeElement()
    };

    // CALLOUT PLUGIN DEFINITION
    // =======================

    var old = $.fn.callout;

    $.fn.callout = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.callout');

            if (!data) $this.data('oc.callout', (data = new Callout(this)));
            if (typeof option == 'string') data[option].call($this)
        })
    };

    $.fn.callout.Constructor = Callout;

    // CALLOUT NO CONFLICT
    // =================

    $.fn.callout.noConflict = function () {
        $.fn.callout = old;
        return this
    };

    // CALLOUT DATA-API
    // ==============

    $(document).on('click.oc.callout.data-api', dismiss, Callout.prototype.close)

}(jQuery);

/*
 * DatePicker plugin
 *
 * - Documentation: ../docs/datepicker.md
 *
 * Dependences:
 * - Pikaday plugin (pikaday.js)
 * - Pikaday jQuery addon (pikaday.jquery.js)
 * - Clockpicker plugin (jquery-clockpicker.js)
 * - Moment library (moment.js)
 * - Moment Timezone library (moment.timezone.js)
 */

+function ($) {
    "use strict";

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var DatePicker = function (element, options) {
        this.$el = $(element);
        this.options = options || {};

        Storm.foundation.controlUtils.markDisposable(element);
        Base.call(this);
        this.init()
    };

    DatePicker.prototype = Object.create(BaseProto);
    DatePicker.prototype.constructor = DatePicker;

    DatePicker.prototype.init = function () {
        var self = this,
            $form = this.$el.closest('form'),
            changeMonitor = $form.data('oc.changeMonitor');

        if (changeMonitor !== undefined) {
            changeMonitor.pause()
        }

        this.dbDateTimeFormat = 'YYYY-MM-DD HH:mm:ss';
        this.dbDateFormat = 'YYYY-MM-DD';
        this.dbTimeFormat = 'HH:mm:ss';

        this.$dataLocker = $('[data-datetime-value]', this.$el);
        this.$datePicker = $('[data-datepicker]', this.$el);
        this.$timePicker = $('[data-timepicker]', this.$el);
        this.hasDate = !!this.$datePicker.length;
        this.hasTime = !!this.$timePicker.length;

        this.initRegion();

        if (this.hasDate) {
            this.initDatePicker()
        }

        if (this.hasTime) {
            this.initTimePicker()
        }

        if (changeMonitor !== undefined) {
            changeMonitor.resume()
        }

        this.$timePicker.on('change.oc.datepicker', function () {
            if (!$.trim($(this).val())) {
                self.emptyValues()
            }
            else {
                self.onSelectTimePicker()
            }
        });

        this.$datePicker.on('change.oc.datepicker', function () {
            if (!$.trim($(this).val())) {
                self.emptyValues()
            }
        });

        this.$el.one('dispose-control', this.proxy(this.dispose))
    };

    DatePicker.prototype.dispose = function () {
        this.$timePicker.off('change.oc.datepicker');
        this.$datePicker.off('change.oc.datepicker');
        this.$el.off('dispose-control', this.proxy(this.dispose));
        this.$el.removeData('oc.datePicker');

        this.$el = null;
        this.options = null;

        BaseProto.dispose.call(this)
    };

    //
    // Datepicker
    //

    DatePicker.prototype.initDatePicker = function () {
        var self = this,
            dateFormat = this.getDateFormat(),
            now = moment().tz(this.timezone).format(dateFormat);

        var pikadayOptions = {
            yearRange: this.options.yearRange,
            format: dateFormat,
            setDefaultDate: now,
            onOpen: function () {
                var $field = $(this._o.trigger);

                $(this.el).css({
                    left: 'auto',
                    right: $(window).width() - $field.offset().left - $field.outerWidth()
                })
            },
            onSelect: function () {
                self.onSelectDatePicker.call(self, this.getMoment())
            }
        };

        var lang = this.getLang('datepicker', false);
        if (lang) {
            pikadayOptions.i18n = lang
        }

        this.$datePicker.val(this.getDataLockerValue(dateFormat));

        if (this.options.minDate) {
            pikadayOptions.minDate = new Date(this.options.minDate)
        }

        if (this.options.maxDate) {
            pikadayOptions.maxDate = new Date(this.options.maxDate)
        }

        this.$datePicker.pikaday(pikadayOptions)
    };

    DatePicker.prototype.onSelectDatePicker = function (pickerMoment) {
        var pickerValue = pickerMoment.format(this.dbDateFormat);

        var timeValue = this.getTimePickerValue();

        var momentObj = moment
            .tz(pickerValue + ' ' + timeValue, this.dbDateTimeFormat, this.timezone)
            .tz(this.appTimezone);

        var lockerValue = momentObj.format(this.dbDateTimeFormat);

        this.$dataLocker.val(lockerValue)
    };

    // Returns in user preference timezone
    DatePicker.prototype.getDatePickerValue = function () {
        var value = this.$datePicker.val();

        if (!this.hasDate || !value) {
            return moment.tz(this.appTimezone)
                .tz(this.timezone)
                .format(this.dbDateFormat)
        }

        return moment(value, this.getDateFormat()).format(this.dbDateFormat)
    };

    DatePicker.prototype.getDateFormat = function () {
        var format = 'YYYY-MM-DD';

        if (this.options.format) {
            format = this.options.format
        }
        else if (this.locale) {
            format = moment()
                .locale(this.locale)
                .localeData()
                .longDateFormat('l')
        }

        return format
    };

    //
    // Timepicker
    //

    DatePicker.prototype.initTimePicker = function () {
        this.$timePicker.clockpicker({
            autoclose: 'true',
            placement: 'bottom',
            align: 'right',
            twelvehour: this.isTimeTwelveHour()
            // afterDone: this.proxy(this.onSelectTimePicker)
        });

        this.$timePicker.val(this.getDataLockerValue(this.getTimeFormat()))
    };

    DatePicker.prototype.onSelectTimePicker = function () {
        var pickerValue = this.$timePicker.val();

        var timeValue = moment(pickerValue, this.getTimeFormat()).format(this.dbTimeFormat);

        var dateValue = this.getDatePickerValue();

        var momentObj = moment
            .tz(dateValue + ' ' + timeValue, this.dbDateTimeFormat, this.timezone)
            .tz(this.appTimezone);

        var lockerValue = momentObj.format(this.dbDateTimeFormat);

        this.$dataLocker.val(lockerValue)
    };

    // Returns in user preference timezone
    DatePicker.prototype.getTimePickerValue = function () {
        var value = this.$timePicker.val();

        if (!this.hasTime || !value) {
            return moment.tz(this.appTimezone)
                .tz(this.timezone)
                .format(this.dbTimeFormat)
        }

        return moment(value, this.getTimeFormat()).format(this.dbTimeFormat)
    };

    DatePicker.prototype.getTimeFormat = function () {
        return this.isTimeTwelveHour()
            ? 'hh:mm A'
            : 'HH:mm'
    };

    DatePicker.prototype.isTimeTwelveHour = function () {
        return false;

        // Disabled for now: The analog clock design is pretty good
        // at representing time regardless of the format. If we want
        // to enable this, there should be some way to disable it
        // again via the form field options.

        // var momentObj = moment()

        // if (this.locale) {
        //     momentObj = momentObj.locale(this.locale)
        // }

        // return momentObj
        //     .localeData()
        //     .longDateFormat('LT')
        //     .indexOf('A') !== -1;
    };

    //
    // Utilities
    //

    DatePicker.prototype.emptyValues = function () {
        this.$dataLocker.val('');
        this.$datePicker.val('');
        this.$timePicker.val('')
    };

    DatePicker.prototype.getDataLockerValue = function (format) {
        var value = this.$dataLocker.val();

        return value
            ? this.getMomentLoadValue(value, format)
            : null
    };

    DatePicker.prototype.getMomentLoadValue = function (value, format) {
        var momentObj = moment.tz(value, this.appTimezone);

        if (this.locale) {
            momentObj = momentObj.locale(this.locale)
        }

        momentObj = momentObj.tz(this.timezone);

        return momentObj.format(format)
    };

    DatePicker.prototype.initRegion = function () {
        this.locale = $('meta[name="backend-locale"]').attr('content');
        this.timezone = $('meta[name="backend-timezone"]').attr('content');
        this.appTimezone = $('meta[name="app-timezone"]').attr('content');

        if (!this.appTimezone) {
            this.appTimezone = 'UTC'
        }

        if (!this.timezone) {
            this.timezone = 'UTC'
        }
    };

    DatePicker.prototype.getLang = function (name, defaultValue) {
        if (Storm === undefined || Storm.lang === undefined) {
            return defaultValue
        }

        return Storm.lang.get(name, defaultValue)
    };

    DatePicker.DEFAULTS = {
        minDate: null,
        maxDate: null,
        format: null,
        yearRange: 10
    };

    // PLUGIN DEFINITION
    // ============================

    var old = $.fn.datePicker;

    $.fn.datePicker = function (option) {
        var args = Array.prototype.slice.call(arguments, 1), items, result;

        items = this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.datePicker');
            var options = $.extend({}, DatePicker.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('oc.datePicker', (data = new DatePicker(this, options)));
            if (typeof option == 'string') result = data[option].apply(data, args);
            if (typeof result != 'undefined') return false
        });

        return result ? result : items
    };

    $.fn.datePicker.Constructor = DatePicker;

    $.fn.datePicker.noConflict = function () {
        $.fn.datePicker = old;
        return this
    };

    $(document).on('render', function () {
        $('[data-control="datepicker"]').datePicker()
    });

}(window.jQuery);

/*
 * Implement the tooltip control automatically
 *
 * Usage:
 *
 *   <a
 *       href="javascript:;"
 *       data-toggle="tooltip"
 *       data-placement="left"
 *       title="Tooltip content">
 *       Some link
 *   </a>
 *
 * Require:
 *  - bootstrap/transition
 *  - bootstrap/tooltip
 */

(function ($) {

    $(document).on('render', function () {
        $('[data-control="tooltip"], [data-toggle="tooltip"]').tooltip()
    })

})(jQuery);
/*
 * Toolbar control.
 *
 * Makes toolbars drag/scrollable.
 * 
 * Data attributes:
 * - data-control="toolbar" - enables the toolbar plugin
 * - data-no-drag-support="true" - disables the drag support for the toolbar, leaving only the mouse wheel support
 *
 * JavaScript API:
 * $('#toolbar').toolbar()
 *
 * Require:
 * - storm/drag.scroll
 */
+function ($) {
    "use strict";

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var Toolbar = function (element, options) {
        var
            $el = this.$el = $(element),
            $toolbar = $el.closest('.control-toolbar');

        Storm.foundation.controlUtils.markDisposable(element);
        this.$toolbar = $toolbar;

        this.options = options || {};

        var noDragSupport = options.noDragSupport !== undefined && options.noDragSupport;

        Base.call(this);

        var scrollClassContainer = options.scrollClassContainer !== undefined
            ? options.scrollClassContainer
            : $el.parent();

        $el.dragScroll({
            scrollClassContainer: scrollClassContainer,
            useDrag: !noDragSupport
        });

        $('.form-control.growable', $toolbar).on('focus.toolbar', function () {
            update()
        });

        $('.form-control.growable', $toolbar).on('blur.toolbar', function () {
            update()
        });

        this.$el.one('dispose-control', this.proxy(this.dispose));

        function update() {
            $(window).trigger('resize')
        }
    };

    Toolbar.prototype = Object.create(BaseProto);
    Toolbar.prototype.constructor = Toolbar;

    Toolbar.prototype.dispose = function () {
        this.$el.off('dispose-control', this.proxy(this.dispose));
        $('.form-control.growable', this.$toolbar).off('.toolbar');
        this.$el.dragScroll('dispose');
        this.$el.removeData('oc.toolbar');
        this.$el = null;

        BaseProto.dispose.call(this)
    };

    Toolbar.DEFAULTS = {};

    // TOOLBAR PLUGIN DEFINITION
    // ============================

    var old = $.fn.toolbar;

    $.fn.toolbar = function (option) {
        var args = Array.prototype.slice.call(arguments, 1);

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.toolbar');
            var options = $.extend({}, Toolbar.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('oc.toolbar', (data = new Toolbar(this, options)));
            if (typeof option == 'string') data[option].apply(data, args)
        })
    };

    $.fn.toolbar.Constructor = Toolbar;

    // TOOLBAR NO CONFLICT
    // =================

    $.fn.toolbar.noConflict = function () {
        $.fn.toolbar = old;
        return this
    };

    // TOOLBAR DATA-API
    // ===============

    $(document).on('render', function () {
        $('[data-control=toolbar]').toolbar()
    })

}(window.jQuery);
/*
 * Filter Widget
 *
 * Data attributes:
 * - data-behavior="filter" - enables the filter plugin
 *
 * Dependences:
 * - October Popover (october.popover.js)
 *
 * Notes:
 *   Ideally this control would not depend on loader or the AJAX framework,
 *   then the Filter widget can use events to handle this business logic.
 *
 * Require:
 *  - mustache/mustache
 *  - modernizr/modernizr
 *  - storm/popover
 */
+function ($) {
    "use strict";

    var FilterWidget = function (element, options) {

        this.$el = $(element);

        this.options = options || {};
        this.scopeValues = {};
        this.$activeScope = null;
        this.activeScopeName = null;
        this.isActiveScopeDirty = false;

        this.init()
    };

    FilterWidget.DEFAULTS = {
        optionsHandler: null,
        updateHandler: null
    };

    /*
     * Get popover template
     */
    FilterWidget.prototype.getPopoverTemplate = function () {
        return '                                                                                        \
                <form>                                                                                  \
                    <input type="hidden" name="scopeName"  value="{{ scopeName }}" />                   \
                    <div id="controlFilterPopover" class="control-filter-popover">                      \
                        <div class="filter-search loading-indicator-container size-input-text">         \
                            <button class="close" data-dismiss="popover" type="button">&times;</button> \
                            <input                                                                      \
                                type="text"                                                             \
                                name="search"                                                           \
                                autocomplete="off"                                                      \
                                class="filter-search-input form-control icon search"                    \
                                data-request="{{ optionsHandler }}"                                     \
                                data-load-indicator-opaque                                              \
                                data-load-indicator                                                     \
                                data-track-input />                                                     \
                        </div>                                                                          \
                        <div class="filter-items">                                                      \
                            <ul>                                                                        \
                                {{#available}}                                                          \
                                    <li data-item-id="{{id}}"><a href="javascript:;">{{name}}</a></li>  \
                                {{/available}}                                                          \
                                {{#loading}}                                                            \
                                    <li class="loading"><span></span></li>                              \
                                {{/loading}}                                                            \
                            </ul>                                                                       \
                        </div>                                                                          \
                        <div class="filter-active-items">                                               \
                            <ul>                                                                        \
                                {{#active}}                                                             \
                                    <li data-item-id="{{id}}"><a href="javascript:;">{{name}}</a></li>  \
                                {{/active}}                                                             \
                            </ul>                                                                       \
                        </div>                                                                          \
                    </div>                                                                              \
                </form>                                                                                 \
            '
    };

    FilterWidget.prototype.init = function () {
        var self = this;

        this.$el.on('change', '.filter-scope input[type="checkbox"]', function () {
            var $scope = $(this).closest('.filter-scope');

            if ($scope.hasClass('is-indeterminate')) {
                self.switchToggle($(this))
            }
            else {
                self.checkboxToggle($(this))
            }
        });

        $('.filter-scope input[type="checkbox"]', this.$el).each(function () {
            $(this)
                .closest('.filter-scope')
                .toggleClass('active', $(this).is(':checked'))
        });

        this.$el.on('click', 'a.filter-scope', function () {
            var $scope = $(this),
                scopeName = $scope.data('scope-name');

            // Second click closes the filter scope
            if ($scope.hasClass('filter-scope-open')) return;

            self.$activeScope = $scope;
            self.activeScopeName = scopeName;
            self.isActiveScopeDirty = false;
            self.displayPopover($scope);
            $scope.addClass('filter-scope-open')
        });

        this.$el.on('show.oc.popover', 'a.filter-scope', function () {
            self.focusSearch()
        });

        this.$el.on('hide.oc.popover', 'a.filter-scope', function () {
            var $scope = $(this);
            self.pushOptions(self.activeScopeName);
            self.activeScopeName = null;
            self.$activeScope = null;

            // Second click closes the filter scope
            setTimeout(function () {
                $scope.removeClass('filter-scope-open')
            }, 200)
        });

        $(document).on('click', '#controlFilterPopover .filter-items > ul > li', function () {
            self.selectItem($(this))
        });

        $(document).on('click', '#controlFilterPopover .filter-active-items > ul > li', function () {
            self.selectItem($(this), true)
        });

        $(document).on('ajaxDone', '#controlFilterPopover input.filter-search-input', function (event, context, data) {
            self.filterAvailable(data.scopeName, data.options.available)
        })
    };

    FilterWidget.prototype.focusSearch = function () {
        if (Modernizr.touch)
            return;

        var $input = $('#controlFilterPopover input.filter-search-input'),
            length = $input.val().length;

        $input.focus();
        $input.get(0).setSelectionRange(length, length)
    };

    FilterWidget.prototype.updateScopeSetting = function ($scope, amount) {
        var $setting = $scope.find('.filter-setting');

        if (amount) {
            $setting.text(amount);
            $scope.addClass('active')
        }
        else {
            $setting.text(this.getLang('filter.group.all', 'all'));
            $scope.removeClass('active')
        }
    };

    FilterWidget.prototype.selectItem = function ($item, isDeselect) {
        var $otherContainer = isDeselect
            ? $item.closest('.control-filter-popover').find('.filter-items:first > ul')
            : $item.closest('.control-filter-popover').find('.filter-active-items:first > ul');

        $item
            .addClass('animate-enter')
            .prependTo($otherContainer)
            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                $(this).removeClass('animate-enter')
            });

        if (!this.scopeValues[this.activeScopeName])
            return;

        var
            itemId = $item.data('item-id'),
            items = this.scopeValues[this.activeScopeName],
            fromItems = isDeselect ? items.active : items.available,
            toItems = isDeselect ? items.available : items.active,
            testFunc = function (item) {
                return item.id == itemId
            },
            item = $.grep(fromItems, testFunc).pop(),
            filtered = $.grep(fromItems, testFunc, true);

        if (isDeselect)
            this.scopeValues[this.activeScopeName].active = filtered;
        else
            this.scopeValues[this.activeScopeName].available = filtered;

        if (item)
            toItems.push(item);

        this.updateScopeSetting(this.$activeScope, items.active.length);
        this.isActiveScopeDirty = true;
        this.focusSearch()
    };

    FilterWidget.prototype.displayPopover = function ($scope) {
        var self = this,
            scopeName = $scope.data('scope-name'),
            data = this.scopeValues[scopeName],
            isLoaded = true;

        if (!data) {
            data = {loading: true};
            isLoaded = false
        }

        data.scopeName = scopeName;
        data.optionsHandler = self.options.optionsHandler;

        // Destroy any popovers already bound
        $scope.data('oc.popover', null);

        $scope.ocPopover({
            content: Mustache.render(self.getPopoverTemplate(), data),
            modal: false,
            highlightModalTarget: true,
            closeOnPageClick: true,
            placement: 'bottom'
        });

        // Load options for the first time
        if (!isLoaded) {
            self.loadOptions(scopeName)
        }
    };

    /*
     * Returns false if loading options is instant,
     * otherwise returns a deferred promise object.
     */
    FilterWidget.prototype.loadOptions = function (scopeName) {
        var $form = this.$el.closest('form'),
            self = this,
            data = {scopeName: scopeName};

        /*
         * Dataset provided manually
         */
        var populated = this.$el.data('filterScopes');
        if (populated && populated[scopeName]) {
            self.fillOptions(scopeName, populated[scopeName]);
            return false
        }

        /*
         * Request options from server
         */
        return $form.request(this.options.optionsHandler, {
            data: data,
            success: function (data) {
                self.fillOptions(scopeName, data.options)
            }
        })
    };

    FilterWidget.prototype.fillOptions = function (scopeName, data) {
        if (this.scopeValues[scopeName])
            return;

        if (!data.active) data.active = [];
        if (!data.available) data.available = [];

        this.scopeValues[scopeName] = data;

        // Do not render if scope has changed
        if (scopeName != this.activeScopeName)
            return;

        /*
         * Inject available
         */
        var container = $('#controlFilterPopover .filter-items > ul').empty();
        this.addItemsToListElement(container, data.available);

        /*
         * Inject active
         */
        var container = $('#controlFilterPopover .filter-active-items > ul');
        this.addItemsToListElement(container, data.active)
    };

    FilterWidget.prototype.filterAvailable = function (scopeName, available) {
        if (this.activeScopeName != scopeName)
            return;

        if (!this.scopeValues[this.activeScopeName])
            return;

        var
            self = this,
            filtered = [],
            items = this.scopeValues[scopeName];

        /*
         * Ensure any active items do not appear in the search results
         */
        if (items.active.length) {
            var activeIds = [];
            $.each(items.active, function (key, obj) {
                activeIds.push(obj.id)
            });

            filtered = $.grep(available, function (item) {
                return $.inArray(item.id, activeIds) === -1
            })
        }
        else {
            filtered = available
        }

        var container = $('#controlFilterPopover .filter-items > ul').empty();
        self.addItemsToListElement(container, filtered)
    };

    FilterWidget.prototype.addItemsToListElement = function ($ul, items) {
        $.each(items, function (key, obj) {
            var item = $('<li />').data({'item-id': obj.id})
                .append($('<a />').prop({'href': 'javascript:;',}).text(obj.name));

            $ul.append(item)
        })
    };

    /*
     * Saves the options to the update handler
     */
    FilterWidget.prototype.pushOptions = function (scopeName) {
        if (!this.isActiveScopeDirty || !this.options.updateHandler)
            return;

        var $form = this.$el.closest('form'),
            data = {
                scopeName: scopeName,
                options: this.scopeValues[scopeName]
            };

        Storm.stripeLoadIndicator.show();
        $form.request(this.options.updateHandler, {
            data: data
        }).always(function () {
            Storm.stripeLoadIndicator.hide()
        })
    };

    FilterWidget.prototype.checkboxToggle = function ($el) {
        var isChecked = $el.is(':checked'),
            $scope = $el.closest('.filter-scope'),
            scopeName = $scope.data('scope-name');

        this.scopeValues[scopeName] = isChecked;

        if (this.options.updateHandler) {
            var $form = this.$el.closest('form'),
                data = {
                    scopeName: scopeName,
                    value: isChecked
                };

            Storm.stripeLoadIndicator.show();
            $form.request(this.options.updateHandler, {
                data: data
            }).always(function () {
                Storm.stripeLoadIndicator.hide()
            })
        }

        $scope.toggleClass('active', isChecked)
    };

    FilterWidget.prototype.switchToggle = function ($el) {
        var switchValue = $el.data('checked'),
            $scope = $el.closest('.filter-scope'),
            scopeName = $scope.data('scope-name');

        this.scopeValues[scopeName] = switchValue;

        if (this.options.updateHandler) {
            var $form = this.$el.closest('form'),
                data = {
                    scopeName: scopeName,
                    value: switchValue
                };

            Storm.stripeLoadIndicator.show();
            $form.request(this.options.updateHandler, {
                data: data
            }).always(function () {
                Storm.stripeLoadIndicator.hide()
            })
        }

        $scope.toggleClass('active', !!switchValue)
    };

    FilterWidget.prototype.getLang = function (name, defaultValue) {
        if (Storm === undefined || Storm.lang === undefined) {
            return defaultValue
        }

        return Storm.lang.get(name, defaultValue)
    };


    // FILTER WIDGET PLUGIN DEFINITION
    // ============================

    var old = $.fn.filterWidget;

    $.fn.filterWidget = function (option) {
        var args = arguments,
            result;

        this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.filterwidget');
            var options = $.extend({}, FilterWidget.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('oc.filterwidget', (data = new FilterWidget(this, options)));
            if (typeof option == 'string') result = data[option].call($this);
            if (typeof result != 'undefined') return false
        });

        return result ? result : this
    };

    $.fn.filterWidget.Constructor = FilterWidget;

    // FILTER WIDGET NO CONFLICT
    // =================

    $.fn.filterWidget.noConflict = function () {
        $.fn.filterWidget = old;
        return this
    };

    // FILTER WIDGET DATA-API
    // ==============

    $(document).on('render', function () {
        $('[data-control="filterwidget"]').filterWidget();
    })

}(window.jQuery);


/*
 * Filter Widget
 *
 * Data attributes:
 * - data-behavior="filter" - enables the filter plugin
 *
 * Dependences:
 * - October Popover (october.popover.js)
 *
 * Notes:
 *   Ideally this control would not depend on loader or the AJAX framework,
 *   then the Filter widget can use events to handle this business logic.
 *
 * Require:
 *  - mustache/mustache
 *  - modernizr/modernizr
 *  - storm/popover
 */
+function ($) {
    "use strict";

    var FilterWidget = $.fn.filterWidget.Constructor;

    // OVERLOADED MODULE
    // =================

    var overloaded_init = FilterWidget.prototype.init;

    FilterWidget.prototype.init = function () {
        overloaded_init.apply(this);

        this.initRegion();
        this.initFilterDate()
    };


    // NEW MODULE
    // =================

    FilterWidget.prototype.initFilterDate = function () {
        var self = this;

        this.$el.on('show.oc.popover', 'a.filter-scope-date', function () {
            self.initDatePickers($(this).hasClass('range'))
        });

        this.$el.on('hiding.oc.popover', 'a.filter-scope-date', function () {
            self.clearDatePickers()
        });

        this.$el.on('hide.oc.popover', 'a.filter-scope-date', function () {
            var $scope = $(this);
            self.pushOptions(self.activeScopeName);
            self.activeScopeName = null;
            self.$activeScope = null;

            // Second click closes the filter scope
            setTimeout(function () {
                $scope.removeClass('filter-scope-open')
            }, 200)
        });

        this.$el.on('click', 'a.filter-scope-date', function () {
            var $scope = $(this),
                scopeName = $scope.data('scope-name');

            // Ignore if already opened
            if ($scope.hasClass('filter-scope-open')) return;

            // Ignore if another popover is opened
            if (null !== self.activeScopeName) return;

            self.$activeScope = $scope;
            self.activeScopeName = scopeName;
            self.isActiveScopeDirty = false;

            if ($scope.hasClass('range')) {
                self.displayPopoverRange($scope)
            }
            else {
                self.displayPopoverDate($scope)
            }

            $scope.addClass('filter-scope-open')
        });

        $(document).on('click', '#controlFilterPopover [data-trigger="filter"]', function (e) {
            e.preventDefault();
            e.stopPropagation();

            self.filterByDate()
        });

        $(document).on('click', '#controlFilterPopover [data-trigger="clear"]', function (e) {
            e.preventDefault();
            e.stopPropagation();

            self.filterByDate(true)
        })
    };

    /*
     * Get popover date template
     */
    FilterWidget.prototype.getPopoverDateTemplate = function () {
        return '                                                                                                        \
                <form>                                                                                                  \
                    <input type="hidden" name="scopeName" value="{{ scopeName }}" />                                    \
                    <div id="controlFilterPopover" class="control-filter-popover control-filter-date-popover">          \
                        <div class="filter-search loading-indicator-container size-input-text">                         \
                            <div class="field-datepicker">                                                              \
                                <div class="input-with-icon right-align">                                               \
                                    <i class="icon icon-calendar-o"></i>                                                \
                                    <input                                                                              \
                                        type="text"                                                                     \
                                        name="date"                                                                     \
                                        value="{{ date }}"                                                              \
                                        class="form-control align-right"                                                \
                                        autocomplete="off"                                                              \
                                        placeholder="{{ date_placeholder }}" />                                         \
                                </div>                                                                                  \
                            </div>                                                                                      \
                            <div class="filter-buttons">                                                                \
                                <button class="btn btn-block btn-secondary" data-trigger="clear">                       \
                                    {{ reset_button_text }}                                                             \
                                </button>                                                                               \
                            </div>                                                                                      \
                        </div>                                                                                          \
                    </div>                                                                                              \
                </form>                                                                                                 \
            '
    };

    /*
     * Get popover range template
     */
    FilterWidget.prototype.getPopoverRangeTemplate = function () {
        return '                                                                                                        \
                <form>                                                                                                  \
                    <input type="hidden" name="scopeName" value="{{ scopeName }}" />                                    \
                    <div id="controlFilterPopover" class="control-filter-popover control-filter-date-popover --range">  \
                        <div class="filter-search loading-indicator-container size-input-text">                         \
                            <div class="field-datepicker">                                                              \
                                <div class="input-with-icon right-align">                                               \
                                    <i class="icon icon-calendar-o"></i>                                                \
                                    <input                                                                              \
                                        type="text"                                                                     \
                                        name="date"                                                                     \
                                        value="{{ date }}"                                                              \
                                        class="form-control align-right"                                                \
                                        autocomplete="off"                                                              \
                                        placeholder="{{ after_placeholder }}" />                                        \
                                </div>                                                                                  \
                            </div>                                                                                      \
                            <div class="field-datepicker">                                                              \
                                <div class="input-with-icon right-align">                                               \
                                    <i class="icon icon-calendar-o"></i>                                                \
                                    <input                                                                              \
                                        type="text"                                                                     \
                                        name="date"                                                                     \
                                        value="{{ date }}"                                                              \
                                        class="form-control align-right"                                                \
                                        autocomplete="off"                                                              \
                                        placeholder="{{ before_placeholder }}" />                                       \
                                </div>                                                                                  \
                            </div>                                                                                      \
                            <div class="filter-buttons">                                                                \
                                <button class="btn btn-block btn-primary" data-trigger="filter">                        \
                                    {{ filter_button_text }}                                                            \
                                </button>                                                                               \
                                <button class="btn btn-block btn-secondary" data-trigger="clear">                       \
                                    {{ reset_button_text }}                                                             \
                                </button>                                                                               \
                            </div>                                                                                      \
                        </div>                                                                                          \
                    </div>                                                                                              \
                </form>                                                                                                 \
            '
    };

    FilterWidget.prototype.displayPopoverDate = function ($scope) {
        var self = this,
            scopeName = $scope.data('scope-name'),
            data = this.scopeValues[scopeName];

        data = $.extend({}, data, {
            filter_button_text: this.getLang('filter.dates.filter_button_text'),
            reset_button_text: this.getLang('filter.dates.reset_button_text'),
            date_placeholder: this.getLang('filter.dates.date_placeholder', 'Date')
        });

        data.scopeName = scopeName;

        // Destroy any popovers already bound
        $scope.data('oc.popover', null);

        $scope.ocPopover({
            content: Mustache.render(this.getPopoverDateTemplate(), data),
            modal: false,
            highlightModalTarget: true,
            closeOnPageClick: true,
            placement: 'bottom',
            onCheckDocumentClickTarget: function (target) {
                return self.onCheckDocumentClickTargetDatePicker(target)
            }
        })
    };

    FilterWidget.prototype.displayPopoverRange = function ($scope) {
        var self = this,
            scopeName = $scope.data('scope-name'),
            data = this.scopeValues[scopeName];

        data = $.extend({}, data, {
            filter_button_text: this.getLang('filter.dates.filter_button_text'),
            reset_button_text: this.getLang('filter.dates.reset_button_text'),
            after_placeholder: this.getLang('filter.dates.after_placeholder', 'After'),
            before_placeholder: this.getLang('filter.dates.before_placeholder', 'Before')
        });

        data.scopeName = scopeName;

        // Destroy any popovers already bound
        $scope.data('oc.popover', null);

        $scope.ocPopover({
            content: Mustache.render(this.getPopoverRangeTemplate(), data),
            modal: false,
            highlightModalTarget: true,
            closeOnPageClick: true,
            placement: 'bottom',
            onCheckDocumentClickTarget: function (target) {
                return self.onCheckDocumentClickTargetDatePicker(target)
            }
        })
    };

    FilterWidget.prototype.initDatePickers = function (isRange) {
        var self = this,
            scopeData = this.$activeScope.data('scope-data'),
            $inputs = $('.field-datepicker input', '#controlFilterPopover'),
            data = this.scopeValues[this.activeScopeName];

        if (!data) {
            data = {
                dates: isRange ? (scopeData.dates ? scopeData.dates : []) : (scopeData.date ? [scopeData.date] : [])
            }
        }

        $inputs.each(function (index, datepicker) {
            var defaultValue = '',
                $datepicker = $(datepicker),
                defaults = {
                    minDate: new Date(scopeData.minDate),
                    maxDate: new Date(scopeData.maxDate),
                    yearRange: 10,
                    setDefaultDate: '' !== defaultValue ? defaultValue.toDate() : '',
                    format: self.getDateFormat(),
                    i18n: self.getLang('datepicker')
                };

            if (0 <= index && index < data.dates.length) {
                defaultValue = data.dates[index] ? moment.tz(data.dates[index], self.appTimezone).tz(self.timezone) : ''
            }

            if (!isRange) {
                defaults.onSelect = function () {
                    self.filterByDate()
                }
            }

            datepicker.value = '' !== defaultValue ? defaultValue.format(self.getDateFormat()) : '';

            $datepicker.pikaday(defaults)
        })
    };

    FilterWidget.prototype.clearDatePickers = function () {
        var $inputs = $('.field-datepicker input', '#controlFilterPopover');

        $inputs.each(function (index, datepicker) {
            var $datepicker = $(datepicker);

            $datepicker.data('pikaday').destroy()
        })
    };

    FilterWidget.prototype.updateScopeDateSetting = function ($scope, dates) {
        var $setting = $scope.find('.filter-setting'),
            dateFormat = this.getDateFormat(),
            dateRegex = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
            reset = false;

        if (dates && dates.length) {
            dates[0] = dates[0] && dates[0].match(dateRegex) ? dates[0] : null;

            if (dates.length > 1) {
                dates[1] = dates[1] && dates[1].match(dateRegex) ? dates[1] : null;

                if (dates[0] || dates[1]) {
                    var after = dates[0] ? moment.tz(dates[0], this.appTimezone).tz(this.timezone).format(dateFormat) : '∞',
                        before = dates[1] ? moment.tz(dates[1], this.appTimezone).tz(this.timezone).format(dateFormat) : '∞';

                    $setting.text(after + ' → ' + before)
                } else {
                    reset = true
                }
            }
            else if (dates[0]) {
                $setting.text(moment.tz(dates[0], this.appTimezone).tz(this.timezone).format(dateFormat))
            } else {
                reset = true
            }
        }
        else {
            reset = true
        }

        if (reset) {
            $setting.text(this.getLang('filter.dates.all', 'all'));
            $scope.removeClass('active')
        } else {
            $scope.addClass('active')
        }
    };

    FilterWidget.prototype.filterByDate = function (isReset) {
        var self = this,
            dates = [];

        if (!isReset) {
            var datepickers = $('.field-datepicker input', '#controlFilterPopover');

            datepickers.each(function (index, datepicker) {
                var date = $(datepicker).data('pikaday').toString('YYYY-MM-DD');

                if (date.match(/\d{4}-\d{2}-\d{2}/)) {
                    if (index === 0) {
                        date += ' 00:00:00'
                    } else if (index === 1) {
                        date += ' 23:59:59'
                    }

                    date = moment.tz(date, self.timezone)
                        .tz(self.appTimezone)
                        .format('YYYY-MM-DD HH:mm:ss')
                } else {
                    date = null
                }

                dates.push(date)
            })
        }

        this.updateScopeDateSetting(this.$activeScope, dates);
        this.scopeValues[this.activeScopeName] = {
            dates: dates
        };
        this.isActiveScopeDirty = true;
        this.$activeScope.data('oc.popover').hide()
    };

    FilterWidget.prototype.getDateFormat = function () {
        if (this.locale) {
            return moment()
                .locale(this.locale)
                .localeData()
                .longDateFormat('l')
        }

        return 'YYYY-MM-DD'
    };

    FilterWidget.prototype.onCheckDocumentClickTargetDatePicker = function (target) {
        var $target = $(target);

        // If the click happens on a pikaday element, do not close the popover
        return $target.hasClass('pika-next') ||
            $target.hasClass('pika-prev') ||
            $target.hasClass('pika-select') ||
            $target.hasClass('pika-button') ||
            $target.parents('.pika-table').length ||
            $target.parents('.pika-title').length
    };

    FilterWidget.prototype.initRegion = function () {
        this.locale = $('meta[name="backend-locale"]').attr('content');
        this.timezone = $('meta[name="backend-timezone"]').attr('content');
        this.appTimezone = $('meta[name="app-timezone"]').attr('content');

        if (!this.appTimezone) {
            this.appTimezone = 'UTC'
        }

        if (!this.timezone) {
            this.timezone = 'UTC'
        }
    }

}(window.jQuery);
/*
 * Select control
 *
 * Require:
 *  - modernizr/modernizr
 *  - select2/select2.full
 */

(function ($) {

    /*
     * Custom drop downs (Desktop only)
     */
    $(document).on('render', function () {
        var formatSelectOption = function (state) {
            if (!state.id)
                return state.text; // optgroup

            var $option = $(state.element),
                iconClass = $option.data('icon'),
                imageSrc = $option.data('image');

            if (iconClass)
                return '<i class="select-icon ' + iconClass + '"></i> ' + state.text;

            if (imageSrc)
                return '<img class="select-image" src="' + imageSrc + '" alt="" /> ' + state.text;

            return state.text
        };

        var selectOptions = {
            templateResult: formatSelectOption,
            templateSelection: formatSelectOption,
            escapeMarkup: function (m) {
                return m
            },
            width: 'style'
        };

        /*
         * Bind custom select
         */
        $('select.custom-select').each(function () {
            var $element = $(this),
                extraOptions = {
                    dropdownCssClass: '',
                    containerCssClass: ''
                };

            // Prevent duplicate loading
            if ($element.data('select2') != null) {
                return true; // Continue
            }

            $element.attr('data-disposable', 'data-disposable');
            $element.one('dispose-control', function () {
                if ($element.data('select2')) {
                    $element.select2('destroy')
                }
            });

            if ($element.hasClass('select-no-search')) {
                extraOptions.minimumResultsForSearch = Infinity
            }
            if ($element.hasClass('select-no-dropdown')) {
                extraOptions.dropdownCssClass += ' select-no-dropdown';
                extraOptions.containerCssClass += ' select-no-dropdown'
            }

            if ($element.hasClass('select-hide-selected')) {
                extraOptions.dropdownCssClass += ' select-hide-selected'
            }

            var separators = $element.data('token-separators');
            if (separators) {
                extraOptions.tags = true;
                extraOptions.tokenSeparators = separators.split('|');

                /*
                 * When the dropdown is hidden, force the first option to be selected always.
                 */
                if ($element.hasClass('select-no-dropdown')) {
                    extraOptions.selectOnClose = true;
                    extraOptions.closeOnSelect = false;

                    $element.on('select2:closing', function () {
                        $('.select2-dropdown.select-no-dropdown:first .select2-results__option--highlighted').removeClass('select2-results__option--highlighted');
                        $('.select2-dropdown.select-no-dropdown:first .select2-results__option:first').addClass('select2-results__option--highlighted')
                    })
                }
            }

            var placeholder = $element.data('placeholder');
            if (placeholder) {
                extraOptions.placeholder = placeholder
            }

            $element.select2($.extend({}, selectOptions, extraOptions))
        })
    });

    $(document).on('disable', 'select.custom-select', function (event, status) {
        if ($(this).data('select2') != null) {
            $(this).select2('enable', !status)
        }
    })

})(jQuery);

/*
 * The loading indicator.
 *
 * The load indicator DIV is injected inside its container. The container should have 
 * the relative position (use the loading-indicator-container class for it).
 *
 * Used with framework.js
 *
 * data-load-indicator="Message" - displays a load indicator with a supplied message, the element
 * must be wrapped in a `<div class="loading-indicator-container"></div>` container.
 *
 * JavaScript API:
 *
 * $('#buttons').loadIndicator({ text: 'Saving...', opaque: true }) - display the indicator in a solid (opaque) state
 * $('#buttons').loadIndicator({ text: 'Saving...' }) - display the indicator in a transparent state
 * $('#buttons').loadIndicator('hide') - display the indicator
 */
+function ($) {
    "use strict";

    var LoadIndicator = function (element, options) {

        this.$el = $(element);

        this.options = options || {};
        this.tally = 0;
        this.show()
    };

    LoadIndicator.prototype.hide = function () {
        this.tally--;

        if (this.tally <= 0) {
            $('div.loading-indicator', this.$el).remove();
            this.$el.removeClass('in-progress')
        }
    };

    LoadIndicator.prototype.show = function (options) {
        if (options)
            this.options = options;

        this.hide();

        var indicator = $('<div class="loading-indicator"></div>');
        indicator.append($('<div></div>').text(this.options.text));
        indicator.append($('<span></span>'));
        if (this.options.opaque !== undefined) {
            indicator.addClass('is-opaque')
        }

        this.$el.prepend(indicator);
        this.$el.addClass('in-progress');

        this.tally++
    };

    LoadIndicator.prototype.destroy = function () {
        this.$el.removeData('oc.loadIndicator');
        this.$el = null
    };

    LoadIndicator.DEFAULTS = {
        text: ''
    };

    // LOADINDICATOR PLUGIN DEFINITION
    // ============================

    var old = $.fn.loadIndicator;

    $.fn.loadIndicator = function (option) {
        var args = arguments;

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.loadIndicator');
            var options = $.extend({}, LoadIndicator.DEFAULTS, typeof option == 'object' && option);

            if (!data) {
                if (typeof option == 'string')
                    return;

                $this.data('oc.loadIndicator', (data = new LoadIndicator(this, options)))
            } else {
                if (typeof option !== 'string')
                    data.show(options);
                else {
                    var methodArgs = [];
                    for (var i = 1; i < args.length; i++)
                        methodArgs.push(args[i])

                    data[option].apply(data, methodArgs)
                }
            }
        })
    };

    $.fn.loadIndicator.Constructor = LoadIndicator;

    // LOADINDICATOR NO CONFLICT
    // =================

    $.fn.loadIndicator.noConflict = function () {
        $.fn.loadIndicator = old;
        return this
    };

    // LOADINDICATOR DATA-API
    // ==============

    $(document)
        .on('ajaxPromise', '[data-load-indicator]', function () {
            var
                indicatorContainer = $(this).closest('.loading-indicator-container'),
                loadingText = $(this).data('load-indicator'),
                options = {
                    opaque: $(this).data('load-indicator-opaque')
                };

            if (loadingText)
                options.text = loadingText;

            indicatorContainer.loadIndicator(options)
        })
        .on('ajaxFail ajaxDone', '[data-load-indicator]', function () {
            $(this).closest('.loading-indicator-container').loadIndicator('hide')
        })


}(window.jQuery);
/*
 * The loading indicator for the mouse cursor.
 *
 * Displays the animated loading indicator following the mouse cursor.
 *
 * JavaScript API:
 * Storm.cursorLoadIndicator.show(event)
 * Storm.cursorLoadIndicator.hide()
 *
 * By default if the show() method has been called several times, the hide() method should be
 * called the same number of times in order to hide the cursor. Use hide(true) to hide the 
 * indicator forcibly.
 *
 * The event parameter in the show() method is optional. If it is passed, the initial cursor position
 * will be loaded from it.
 *
 * Require:
 *  - modernizr/modernizr
 */
+function ($) {
    "use strict";
    if (window.Storm === undefined) {
        window.Storm = {};
    }

    var CursorLoadIndicator = function () {
        if (Modernizr.touch)
            return;

        this.counter = 0;
        this.indicator = $('<div/>').addClass('cursor-loading-indicator').addClass('hide');
        $(document.body).append(this.indicator)
    };

    CursorLoadIndicator.prototype.show = function (event) {
        if (Modernizr.touch)
            return;

        this.counter++;

        if (this.counter > 1)
            return;

        var self = this;

        if (event !== undefined && event.clientY !== undefined) {
            self.indicator.css({
                left: event.clientX + 15,
                top: event.clientY + 15
            })
        }

        this.indicator.removeClass('hide');
        $(window).on('mousemove.cursorLoadIndicator', function (e) {
            self.indicator.css({
                left: e.clientX + 15,
                top: e.clientY + 15,
            })
        })
    };

    CursorLoadIndicator.prototype.hide = function (force) {
        if (Modernizr.touch)
            return;

        this.counter--;
        if (force !== undefined && force)
            this.counter = 0;

        if (this.counter <= 0) {
            this.indicator.addClass('hide');
            $(window).off('.cursorLoadIndicator');
        }
    };

    $(document).ready(function () {
        Storm.cursorLoadIndicator = new CursorLoadIndicator();
    });

    // CURSORLOADINDICATOR DATA-API
    // ==============

    $(document)
        .on('ajaxPromise', '[data-cursor-load-indicator]', function () {
            Storm.cursorLoadIndicator.show()
        }).on('ajaxFail ajaxDone', '[data-cursor-load-indicator]', function () {
        Storm.cursorLoadIndicator.hide()
    })

}(window.jQuery);
/*
 * The stripe loading indicator.
 *
 * Displays the animated loading indicator stripe at the top of the page.
 *
 * JavaScript API:
 * Storm.stripeLoadIndicator.show(event)
 * Storm.stripeLoadIndicator.hide()
 *
 * By default if the show() method has been called several times, the hide() method should be
 * called the same number of times in order to hide the stripe. Use hide(true) to hide the 
 * indicator forcibly.
 */
+function ($) {
    "use strict";
    if (window.Storm === undefined) {
        window.Storm = {};
    }

    var StripeLoadIndicator = function () {
        var self = this;
        this.counter = 0;
        this.indicator = this.makeIndicator();
        this.stripe = this.indicator.find('.stripe');
        this.animationTimer = null;

        $(document).ready(function () {
            $(document.body).append(self.indicator)
        })
    };

    StripeLoadIndicator.prototype.makeIndicator = function () {
        return $('<div/>')
            .addClass('stripe-loading-indicator loaded')
            .append($('<div />').addClass('stripe'))
            .append($('<div />').addClass('stripe-loaded'))
    };

    StripeLoadIndicator.prototype.show = function () {
        window.clearTimeout(this.animationTimer);
        this.indicator.show();
        this.counter++;

        // Restart the animation
        this.stripe.after(this.stripe = this.stripe.clone()).remove();

        if (this.counter > 1) {
            return
        }

        this.indicator.removeClass('loaded');
        $(document.body).addClass('loading')
    };

    StripeLoadIndicator.prototype.hide = function (force) {

        this.counter--;
        if (force !== undefined && force) {
            this.counter = 0
        }

        if (this.counter <= 0) {
            this.indicator.addClass('loaded');
            $(document.body).removeClass('loading');

            // Stripe should be hidden using `display: none` because leaving the animated
            // element in the rendering tree, even invisible, affects performance.
            var self = this;
            this.animationTimer = window.setTimeout(function () {
                self.indicator.hide()
            }, 1000)
        }
    };

    Storm.stripeLoadIndicator = new StripeLoadIndicator();

    // STRIPE LOAD INDICATOR DATA-API
    // ==============

    $(document)
        .on('ajaxPromise', '[data-stripe-load-indicator]', function (event) {
            // Prevent this event from bubbling up to a non-related data-request
            // element, for example a <form> tag wrapping a <button> tag
            event.stopPropagation();

            Storm.stripeLoadIndicator.show();

            // This code will cover instances where the element has been removed
            // from the DOM, making the resolution event below an orphan.
            var $el = $(this);
            $(window).one('ajaxUpdateComplete', function () {
                if ($el.closest('html').length === 0)
                    Storm.stripeLoadIndicator.hide()
            })
        }).on('ajaxFail ajaxDone', '[data-stripe-load-indicator]', function (event) {
        event.stopPropagation();
        Storm.stripeLoadIndicator.hide()
    })

}(window.jQuery);
/*
 * Popover plugin
 *
 * Options:
 * - placement: top | bottom | left | right | center. The placement could automatically be changed 
 if the popover doesn't fit into the desired position.
 * - fallbackPlacement: top | bottom | left | right. The placement to use if the default placement
 *   and all other possible placements do not work. The default value is "bottom".
 * - content: content HTML string or callback
 * - width: content width, optional. If not specified, the content width will be used.
 * - modal: make the popover modal
 * - highlightModalTarget: "pop" the popover target above the overlay, making it highlighted.
 *   The feature assigns the target position relative.
 * - closeOnPageClick: close the popover if the page was clicked outside the popover area.
 * - container: the popover container selector or element. The default container is the document body.
 *   The container must be relative positioned.
 * - containerClass - a CSS class to apply to the popover container element
 * - offset - offset in pixels to add to the calculated position, to make the position more "random"
 * - offsetX - X offset in pixels to add to the calculated position, to make the position more "random". 
 *   If specified, overrides the offset property for the bottom and top popover placement.
 * - offsetY - Y offset in pixels to add to the calculated position, to make the position more "random". 
 *   If specified, overrides the offset property for the left and right popover placement.
 * - useAnimation: adds animation to the open and close sequence, the equivalent of adding 
 *   the CSS class 'fade' to the containerClass.
 *
 * Methods:
 * - hide
 *
 * Closing the popover. There are 3 ways to close the popover: call it's hide() method, trigger 
 * the close.oc.popover on any element inside the popover or click an element with attribute 
 * data-dismiss="popover" inside the popover.
 *
 * Events:
 * - showing.oc.popover - triggered before the popover is displayed. Allows to override the 
 *   popover options (for example the content) or cancel the action with e.preventDefault()
 * - show.oc.popover - triggered after the popover is displayed.
 * - hiding.oc.popover - triggered before the popover is closed. Allows to cancel the action with
 *   e.preventDefault()
 * - hide.oc.popover - triggered after the popover is hidden.
 *
 * JavaScript API:
 * $('#element').ocPopover({
 content: '<p>This is a popover</p>'
 placement: 'top'
 * })
 */
+function ($) {
    "use strict";

    var Popover = function (element, options) {

        var $el = this.$el = $(element);

        this.options = options || {};
        this.arrowSize = 15;
        this.docClickHandler = null;
        this.show()
    };

    Popover.prototype.hide = function () {
        var e = $.Event('hiding.oc.popover', {relatedTarget: this.$el});
        this.$el.trigger(e, this);
        if (e.isDefaultPrevented())
            return;

        this.$container.removeClass('in');
        if (this.$overlay) this.$overlay.removeClass('in');

        this.disposeControls();

        $.support.transition && this.$container.hasClass('fade')
            ? this.$container
                .one($.support.transition.end, $.proxy(this.hidePopover, this))
                .emulateTransitionEnd(300)
            : this.hidePopover()
    };

    Popover.prototype.disposeControls = function () {
        if (this.$container) {
            Storm.foundation.controlUtils.disposeControls(this.$container.get(0))
        }
    };

    Popover.prototype.hidePopover = function () {
        this.$container.remove();
        if (this.$overlay) this.$overlay.remove();

        this.$el.removeClass('popover-highlight');
        this.$el.trigger('hide.oc.popover');

        this.$overlay = false;
        this.$container = false;

        this.$el.data('oc.popover', null);
        $(document.body).removeClass('popover-open');

        $(document).unbind('mousedown', this.docClickHandler);
        $(document).off('.oc.popover');

        this.docClickHandler = null;
        this.options.onCheckDocumentClickTarget = null
    };

    Popover.prototype.show = function (options) {
        var self = this;

        /*
         * Trigger the show event
         */
        var e = $.Event('showing.oc.popover', {relatedTarget: this.$el});
        this.$el.trigger(e, this);
        if (e.isDefaultPrevented())
            return;

        /*
         * Create the popover container and overlay
         */
        this.$container = $('<div />').addClass('control-popover');

        if (this.options.containerClass)
            this.$container.addClass(this.options.containerClass);

        if (this.options.useAnimation)
            this.$container.addClass('fade');

        var $content = $('<div />').html(this.getContent());
        this.$container.append($content);

        if (this.options.width)
            this.$container.width(this.options.width);

        if (this.options.modal) {
            this.$overlay = $('<div />').addClass('popover-overlay');
            $(document.body).append(this.$overlay);
            if (this.options.highlightModalTarget) {
                this.$el.addClass('popover-highlight');
                this.$el.blur()
            }
        } else {
            this.$overlay = false
        }

        if (this.options.container)
            $(this.options.container).append(this.$container);
        else
            $(document.body).append(this.$container);

        /*
         * Determine the popover position
         */
        this.reposition();

        /*
         * Display the popover
         */
        this.$container.addClass('in');
        if (this.$overlay) this.$overlay.addClass('in');

        $(document.body).addClass('popover-open');
        var showEvent = jQuery.Event('show.oc.popover', {relatedTarget: this.$container.get(0)});
        this.$el.trigger(showEvent);

        /*
         * Bind events
         */
        this.$container.on('close.oc.popover', function (e) {
            self.hide()
        });

        this.$container.on('click', '[data-dismiss=popover]', function (e) {
            self.hide();
            return false
        });

        this.docClickHandler = $.proxy(this.onDocumentClick, this);
        $(document).bind('mousedown', this.docClickHandler);

        if (this.options.closeOnEsc) {
            $(document).on('keyup.oc.popover', function (e) {
                if ($(e.target).hasClass('select2-offscreen'))
                    return false;

                if (!self.options.closeOnEsc) { // The value of the option could be changed after the popover is displayed
                    return false
                }

                if (e.keyCode == 27) {
                    self.hide();
                    return false
                }
            })
        }
    };

    Popover.prototype.reposition = function () {
        var
            placement = this.calcPlacement(),
            position = this.calcPosition(placement);

        this.$container.removeClass('placement-center placement-bottom placement-top placement-left placement-right');

        this.$container.css({
            left: position.x,
            top: position.y
        }).addClass('placement-' + placement)
    };

    Popover.prototype.getContent = function () {
        return typeof this.options.content == 'function'
            ? this.options.content.call(this.$el[0], this)
            : this.options.content
    };

    Popover.prototype.calcDimensions = function () {
        var
            documentWidth = $(document).width(),
            documentHeight = $(document).height(),
            targetOffset = this.$el.offset(),
            targetWidth = this.$el.outerWidth(),
            targetHeight = this.$el.outerHeight();

        return {
            containerWidth: this.$container.outerWidth() + this.arrowSize,
            containerHeight: this.$container.outerHeight() + this.arrowSize,
            targetOffset: targetOffset,
            targetHeight: targetHeight,
            targetWidth: targetWidth,
            spaceLeft: targetOffset.left,
            spaceRight: documentWidth - (targetWidth + targetOffset.left),
            spaceTop: targetOffset.top,
            spaceBottom: documentHeight - (targetHeight + targetOffset.top),
            spaceHorizontalBottom: documentHeight - targetOffset.top,
            spaceVerticalRight: documentWidth - targetOffset.left,
            documentWidth: documentWidth
        }
    };

    Popover.prototype.fitsLeft = function (dimensions) {
        return dimensions.spaceLeft >= dimensions.containerWidth &&
            dimensions.spaceHorizontalBottom >= dimensions.containerHeight
    };

    Popover.prototype.fitsRight = function (dimensions) {
        return dimensions.spaceRight >= dimensions.containerWidth &&
            dimensions.spaceHorizontalBottom >= dimensions.containerHeight
    };

    Popover.prototype.fitsBottom = function (dimensions) {
        return dimensions.spaceBottom >= dimensions.containerHeight &&
            dimensions.spaceVerticalRight >= dimensions.containerWidth
    };

    Popover.prototype.fitsTop = function (dimensions) {
        return dimensions.spaceTop >= dimensions.containerHeight &&
            dimensions.spaceVerticalRight >= dimensions.containerWidth
    };

    Popover.prototype.calcPlacement = function () {
        var
            placement = this.options.placement,
            dimensions = this.calcDimensions();

        if (placement == 'center')
            return placement;

        if (placement != 'bottom' && placement != 'top' && placement != 'left' && placement != 'right')
            placement = 'bottom';

        var placementFunctions = {
            top: this.fitsTop,
            bottom: this.fitsBottom,
            left: this.fitsLeft,
            right: this.fitsRight
        };

        if (placementFunctions[placement](dimensions))
            return placement;

        for (var index in placementFunctions) {
            if (placementFunctions[index](dimensions))
                return index
        }

        return this.options.fallbackPlacement
    };

    Popover.prototype.calcPosition = function (placement) {
        var
            dimensions = this.calcDimensions(),
            result;

        switch (placement) {
            case 'left':
                var realOffset = this.options.offsetY === undefined ? this.options.offset : this.options.offsetY;
                result = {
                    x: (dimensions.targetOffset.left - dimensions.containerWidth),
                    y: dimensions.targetOffset.top + realOffset
                };
                break;
            case 'top':
                var realOffset = this.options.offsetX === undefined ? this.options.offset : this.options.offsetX;
                result = {
                    x: dimensions.targetOffset.left + realOffset,
                    y: (dimensions.targetOffset.top - dimensions.containerHeight)
                };
                break;
            case 'bottom':
                var realOffset = this.options.offsetX === undefined ? this.options.offset : this.options.offsetX;
                result = {
                    x: dimensions.targetOffset.left + realOffset,
                    y: (dimensions.targetOffset.top + dimensions.targetHeight + this.arrowSize)
                };
                break;
            case 'right':
                var realOffset = this.options.offsetY === undefined ? this.options.offset : this.options.offsetY;
                result = {
                    x: (dimensions.targetOffset.left + dimensions.targetWidth + this.arrowSize),
                    y: dimensions.targetOffset.top + realOffset
                };
                break;
            case 'center' :
                var windowHeight = $(window).height();
                result = {
                    x: (dimensions.documentWidth / 2 - dimensions.containerWidth / 2),
                    y: (windowHeight / 2 - dimensions.containerHeight / 2)
                };

                if (result.y < 40)
                    result.y = 40;
                break;
        }

        if (!this.options.container)
            return result;

        var
            $container = $(this.options.container),
            containerOffset = $container.offset();

        result.x -= containerOffset.left;
        result.y -= containerOffset.top;

        return result
    };

    Popover.prototype.onDocumentClick = function (e) {
        if (!this.options.closeOnPageClick)
            return;

        if (this.options.onCheckDocumentClickTarget && this.options.onCheckDocumentClickTarget(e.target)) {
            return
        }

        if ($.contains(this.$container.get(0), e.target))
            return;

        this.hide();
    };

    Popover.DEFAULTS = {
        placement: 'bottom',
        fallbackPlacement: 'bottom',
        content: '<p>Popover content<p>',
        width: false,
        modal: false,
        highlightModalTarget: false,
        closeOnPageClick: true,
        closeOnEsc: true,
        container: false,
        containerClass: null,
        offset: 15,
        useAnimation: false,
        onCheckDocumentClickTarget: null
    };

    // POPOVER PLUGIN DEFINITION
    // ============================

    var old = $.fn.ocPopover;

    $.fn.ocPopover = function (option) {
        var args = arguments;

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.popover');
            var options = $.extend({}, Popover.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) {
                if (typeof option == 'string')
                    return;

                $this.data('oc.popover', (data = new Popover(this, options)))
            } else {
                if (typeof option != 'string')
                    return;

                var methodArgs = [];
                for (var i = 1; i < args.length; i++)
                    methodArgs.push(args[i])

                data[option].apply(data, methodArgs)
            }
        })
    };

    $.fn.ocPopover.Constructor = Popover;

    // POPOVER NO CONFLICT
    // =================

    $.fn.ocPopover.noConflict = function () {
        $.fn.ocPopover = old;
        return this
    };

    // POPOVER DATA-API
    // ===============

    $(document).on('click', '[data-control=popover]', function (e) {
        $(this).ocPopover();

        return false;
    })

}(window.jQuery);
/*
 * Ajax Popup plugin
 *
 * Documentation: ../docs/popup.md
 *
 * Require:
 *  - bootstrap/modal
 */

+function ($) {
    "use strict";

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    // POPUP CLASS DEFINITION
    // ============================

    var Popup = function (element, options) {
        this.options = options;
        this.$el = $(element);
        this.$container = null;
        this.$modal = null;
        this.$backdrop = null;
        this.isOpen = false;
        this.firstDiv = null;
        this.allowHide = true;

        this.$container = this.createPopupContainer();
        this.$content = this.$container.find('.modal-content:first');
        this.$dialog = this.$container.find('.modal-dialog:first');
        this.$modal = this.$container.modal({show: false, backdrop: false, keyboard: this.options.keyboard});

        Storm.foundation.controlUtils.markDisposable(element);
        Base.call(this);

        this.initEvents();
        this.init()
    };

    Popup.prototype = Object.create(BaseProto);
    Popup.prototype.constructor = Popup;

    Popup.DEFAULTS = {
        ajax: null,
        handler: null,
        keyboard: true,
        extraData: {},
        content: null,
        size: null,
        adaptiveHeight: false,
        zIndex: null
    };

    Popup.prototype.init = function () {
        var self = this;

        /*
         * Do not allow the same popup to open twice
         */
        if (self.isOpen) return;

        /*
         * Show loading panel
         */
        this.setBackdrop(true);

        if (!this.options.content) {
            this.setLoading(true)
        }

        /*
         * October AJAX
         */
        if (this.options.handler) {

            this.$el.request(this.options.handler, {
                data: paramToObj('data-extra-data', this.options.extraData),
                success: function (data, textStatus, jqXHR) {
                    this.success(data, textStatus, jqXHR).done(function () {
                        self.setContent(data.result);
                        $(window).trigger('ajaxUpdateComplete', [this, data, textStatus, jqXHR]);
                        self.triggerEvent('popupComplete'); // Deprecated
                        self.triggerEvent('complete.oc.popup')
                    })
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    this.error(jqXHR, textStatus, errorThrown).done(function () {
                        self.hide();
                        self.triggerEvent('popupError'); // Deprecated
                        self.triggerEvent('error.oc.popup')
                    })
                }
            })

        }
        /*
         * Regular AJAX
         */
        else if (this.options.ajax) {

            $.ajax({
                url: this.options.ajax,
                data: paramToObj('data-extra-data', this.options.extraData),
                success: function (data) {
                    self.setContent(data)
                },
                cache: false
            })

        }
        /*
         * Specified content
         */
        else if (this.options.content) {

            var content = typeof this.options.content == 'function'
                ? this.options.content.call(this.$el[0], this)
                : this.options.content;

            this.setContent(content)
        }
    };

    Popup.prototype.initEvents = function () {
        var self = this;

        /*
         * Duplicate the popup reference on the .control-popup container
         */
        this.$container.data('oc.popup', this);

        /*
         * Hook in to BS Modal events
         */
        this.$modal.on('hide.bs.modal', function () {
            self.triggerEvent('hide.oc.popup');
            self.isOpen = false;
            self.setBackdrop(false)
        });

        this.$modal.on('hidden.bs.modal', function () {
            self.triggerEvent('hidden.oc.popup');
            self.$container.remove();
            $(document.body).removeClass('modal-open');
            self.dispose()
        });

        this.$modal.on('show.bs.modal', function () {
            self.isOpen = true;
            self.setBackdrop(true);
            $(document.body).addClass('modal-open')
        });

        this.$modal.on('shown.bs.modal', function () {
            self.triggerEvent('shown.oc.popup')
        });

        this.$modal.on('close.oc.popup', function () {
            self.hide();
            return false
        })
    };

    Popup.prototype.dispose = function () {
        this.$modal.off('hide.bs.modal');
        this.$modal.off('hidden.bs.modal');
        this.$modal.off('show.bs.modal');
        this.$modal.off('shown.bs.modal');
        this.$modal.off('close.oc.popup');

        this.$el.off('dispose-control', this.proxy(this.dispose));
        this.$el.removeData('oc.popup');
        this.$container.removeData('oc.popup');

        this.$container = null;
        this.$content = null;
        this.$dialog = null;
        this.$modal = null;
        this.$el = null;

        // In some cases options could contain callbacks, 
        // so it's better to clean them up too.
        this.options = null;

        BaseProto.dispose.call(this)
    };

    Popup.prototype.createPopupContainer = function () {
        var
            modal = $('<div />').prop({
                class: 'control-popup modal fade',
                role: 'dialog',
                tabindex: -1
            }),
            modalDialog = $('<div />').addClass('modal-dialog'),
            modalContent = $('<div />').addClass('modal-content');

        if (this.options.size)
            modalDialog.addClass('size-' + this.options.size);

        if (this.options.adaptiveHeight)
            modalDialog.addClass('adaptive-height');

        if (this.options.zIndex !== null)
            modal.css('z-index', this.options.zIndex + 20);

        return modal.append(modalDialog.append(modalContent))
    };

    Popup.prototype.setContent = function (contents) {
        this.$content.html(contents);
        this.setLoading(false);
        this.show();

        // Duplicate the popup object reference on to the first div
        // inside the popup. Eg: $('#firstDiv').popup('hide')
        this.firstDiv = this.$content.find('>div:first');
        if (this.firstDiv.length > 0)
            this.firstDiv.data('oc.popup', this);

        var $defaultFocus = $('[default-focus]', this.$content);
        if ($defaultFocus.is(":visible")) {
            window.setTimeout(function () {
                $defaultFocus.focus();
                $defaultFocus = null
            }, 300)
        }
    };

    Popup.prototype.setBackdrop = function (val) {
        if (val && !this.$backdrop) {
            this.$backdrop = $('<div class="popup-backdrop fade" />');

            if (this.options.zIndex !== null)
                this.$backdrop.css('z-index', this.options.zIndex);

            this.$backdrop.appendTo(document.body);

            this.$backdrop.addClass('in');
            this.$backdrop.append($('<div class="modal-content popup-loading-indicator" />'))
        }
        else if (!val && this.$backdrop) {
            this.$backdrop.remove();
            this.$backdrop = null
        }
    };

    Popup.prototype.setLoading = function (val) {
        if (!this.$backdrop)
            return;

        var self = this;
        if (val) {
            setTimeout(function () {
                self.$backdrop.addClass('loading');
            }, 100)
        }
        else {
            this.$backdrop.removeClass('loading');
        }
    };

    Popup.prototype.setShake = function () {
        var self = this;

        this.$content.addClass('popup-shaking');

        setTimeout(function () {
            self.$content.removeClass('popup-shaking')
        }, 1000)
    };

    Popup.prototype.hideLoading = function (val) {
        this.setLoading(false);

        // Wait for animations to complete
        var self = this;
        setTimeout(function () {
            self.setBackdrop(false)
        }, 250);
        setTimeout(function () {
            self.hide()
        }, 500)
    };

    Popup.prototype.triggerEvent = function (eventName, params) {
        if (!params) {
            params = [this.$el, this.$modal]
        }

        var eventObject = jQuery.Event(eventName, {relatedTarget: this.$container.get(0)});

        this.$el.trigger(eventObject, params);

        if (this.firstDiv) {
            this.firstDiv.trigger(eventObject, params)
        }
    };

    Popup.prototype.reload = function () {
        this.init()
    };

    Popup.prototype.show = function () {
        this.$modal.modal('show');

        this.$modal.on('click.dismiss.popup', '[data-dismiss="popup"]', $.proxy(this.hide, this));
        this.triggerEvent('popupShow'); // Deprecated
        this.triggerEvent('show.oc.popup');

        // Fixes an issue where the Modal makes `position: fixed` elements relative to itself
        // https://github.com/twbs/bootstrap/issues/15856
        this.$dialog.css('transform', 'inherit')
    };

    Popup.prototype.hide = function () {
        this.triggerEvent('popupHide'); // Deprecated
        this.triggerEvent('hide.oc.popup');

        if (this.allowHide)
            this.$modal.modal('hide');

        // Fixes an issue where the Modal makes `position: fixed` elements relative to itself
        // https://github.com/twbs/bootstrap/issues/15856
        this.$dialog.css('transform', '')
    };

    /*
     * Hide the popup without destroying it,
     * you should call .hide() once finished
     */
    Popup.prototype.visible = function (val) {
        if (val) {
            this.$modal.addClass('in')
        }
        else {
            this.$modal.removeClass('in')
        }
        this.setBackdrop(val)
    };

    Popup.prototype.toggle = function () {
        this.triggerEvent('popupToggle', [this.$modal]); // Deprecated
        this.triggerEvent('toggle.oc.popup', [this.$modal]);

        this.$modal.modal('toggle')
    };

    /*
     * Lock the popup from closing
     */
    Popup.prototype.lock = function (val) {
        this.allowHide = !val
    };

    // POPUP PLUGIN DEFINITION
    // ============================

    var old = $.fn.popup;

    $.fn.popup = function (option) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.popup');
            var options = $.extend({}, Popup.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('oc.popup', (data = new Popup(this, options)));
            else if (typeof option == 'string') data[option].apply(data, args);
            else data.reload()
        })
    };

    $.fn.popup.Constructor = Popup;

    $.popup = function (option) {
        return $('<a />').popup(option)
    };

    // POPUP NO CONFLICT
    // =================

    $.fn.popup.noConflict = function () {
        $.fn.popup = old;
        return this
    };

    // POPUP DATA-API
    // ===============

    function paramToObj(name, value) {
        if (value === undefined) value = '';
        if (typeof value == 'object') return value;

        try {
            return JSON.parse(JSON.stringify(eval("({" + value + "})")))
        }
        catch (e) {
            throw new Error('Error parsing the ' + name + ' attribute value. ' + e)
        }
    }

    $(document).on('click.oc.popup', '[data-control="popup"]', function (event) {
        event.preventDefault();

        $(this).popup()
    });

    /*
     * Only use the popup loading indicator if the handlers are an exact match.
     */
    $(document)
        .on('ajaxPromise', '[data-popup-load-indicator]', function (event, context) {
            if ($(this).data('request') != context.handler) return;
            $(this).closest('.control-popup').removeClass('in').popup('setLoading', true)
        })
        .on('ajaxFail', '[data-popup-load-indicator]', function (event, context) {
            if ($(this).data('request') != context.handler) return;
            $(this).closest('.control-popup').addClass('in').popup('setLoading', false).popup('setShake')
        })
        .on('ajaxDone', '[data-popup-load-indicator]', function (event, context) {
            if ($(this).data('request') != context.handler) return;
            $(this).closest('.control-popup').popup('hideLoading')
        })

}(window.jQuery);

/*
 * October charting utilities.
 */

+function ($) {
    "use strict";

    var ChartUtils = function () {
    };

    ChartUtils.prototype.defaultValueColor = '#b8b8b8';

    ChartUtils.prototype.getColor = function (index) {
        var
            colors = [
                '#95b753', '#cc3300', '#e5a91a', '#3366ff', '#ff0f00', '#ff6600',
                '#ff9e01', '#fcd202', '#f8ff01', '#b0de09', '#04d215', '#0d8ecf', '#0d52d1',
                '#2a0cd0', '#8a0ccf', '#cd0d74', '#754deb', '#dddddd', '#999999', '#333333',
                '#000000', '#57032a', '#ca9726', '#990000', '#4b0c25'
            ],
            colorIndex = index % (colors.length - 1);

        return colors[colorIndex];
    };

    ChartUtils.prototype.loadListValues = function ($list) {
        var result = {
            values: [],
            total: 0,
            max: 0
        };

        $('> li', $list).each(function () {
            var value = $(this).data('value')
                ? parseFloat($(this).data('value'))
                : parseFloat($('span', this).text());
            result.total += value;
            result.values.push({value: value, color: $(this).data('color')});
            result.max = Math.max(result.max, value)
        });

        return result;
    };

    ChartUtils.prototype.getLegendLabel = function ($legend, index) {
        return $('tr:eq(' + index + ') td:eq(1)', $legend).html();
    };

    ChartUtils.prototype.initLegendColorIndicators = function ($legend) {
        var indicators = [];

        $('tr > td:first-child', $legend).each(function () {
            var indicator = $('<i></i>');
            $(this).prepend(indicator);
            indicators.push(indicator)
        });

        return indicators;
    };

    ChartUtils.prototype.createLegend = function ($list) {
        var
            $legend = $('<div>').addClass('chart-legend'),
            $table = $('<table>');

        $legend.append($table);

        $('> li', $list).each(function () {
            var label = $(this).clone().children().remove().end().html();

            $table.append(
                $('<tr>')
                    .append($('<td class="indicator">'))
                    .append($('<td>').html(label))
                    .append($('<td>').addClass('value').html($('span', this).html()))
            )
        });

        $legend.insertAfter($list);
        $list.remove();

        return $legend;
    };

    ChartUtils.prototype.showTooltip = function (x, y, text) {
        var $tooltip = $('#chart-tooltip');

        if ($tooltip.length)
            $tooltip.remove();

        $tooltip = $('<div id="chart-tooltip">')
            .html(text)
            .css('visibility', 'hidden');

        x += 10;
        y += 10;

        $(document.body).append($tooltip);
        var tooltipWidth = $tooltip.outerWidth();
        if ((x + tooltipWidth) > $(window).width())
            x = $(window).width() - tooltipWidth - 10;

        $tooltip.css({top: y, left: x, visibility: 'visible'});
    };

    ChartUtils.prototype.hideTooltip = function () {
        $('#chart-tooltip').remove()
    };

    if (window.Storm === undefined) {
        window.Storm = {};
    }

    Storm.chartUtils = new ChartUtils();
}(window.jQuery);

/*
 * Line Chart Plugin
 *
 * Data attributes:
 * - data-control="chart-line" - enables the line chart plugin
 * - data-reset-zoom-link="#reset-zoom" - specifies a link to reset zoom
 * - data-zoomable - indicates that the chart is zoomable
 * - data-time-mode="weeks" - if the "weeks" value is specified and the xaxis mode is "time", the X axis labels will be displayed as week end dates.
 * - data-chart-options="xaxis: {mode: 'time'}" - specifies the Flot configuration in JSON format. See https://github.com/flot/flot/blob/master/API.md for details.
 *
 * Data sets are defined with the SPAN elements inside the chart element: <span data-chart="dataset" data-set-data="[0,0],[1,19]">
 * Data set elements could contain data attributes with names in the format "data-set-color". The names for the data set
 * attributes are described in the Flot documentation: https://github.com/flot/flot/blob/master/API.md#data-format
 *
 * JavaScript API:
 * $('.chart').chartLine({ resetZoomLink:'#reset-zoom' })
 *
 * Dependences:
 * - Flot (jquery.flot.js)
 * - Flot Tooltip (jquery.flot.tooltip.js)
 * - Flot Resize (jquery.flot.resize.js)
 * - Flot Time (jquery.flot.time.js)
 */

+function ($) {
    "use strict";

    // LINE CHART CLASS DEFINITION
    // ============================

    var ChartLine = function (element, options) {
        var self = this;

        /*
         * Flot options
         */
        this.chartOptions = {
            xaxis: {
                mode: "time",
                tickLength: 5
            },
            selection: {mode: "x"},
            grid: {
                markingsColor: "rgba(0,0,0, 0.02)",
                backgroundColor: {colors: ["#fff", "#fff"]},
                borderColor: "#7bafcc",
                borderWidth: 0,
                color: "#ddd",
                hoverable: true,
                clickable: true,
                labelMargin: 10
            },
            series: {
                lines: {
                    show: true,
                    fill: true
                },
                points: {
                    show: true
                }
            },
            tooltip: true,
            tooltipOpts: {
                defaultTheme: false,
                content: "%x: <strong>%y</strong>",
                dateFormat: "%y-%0m-%0d",
                shifts: {
                    x: 10,
                    y: 20
                }
            },
            legend: {
                show: true,
                noColumns: 2
            }
        };

        this.defaultDataSetOptions = {
            shadowSize: 0
        };

        var parsedOptions = {};
        try {
            parsedOptions = JSON.parse(JSON.stringify(eval("({" + options.chartOptions + "})")));
        } catch (e) {
            throw new Error('Error parsing the data-chart-options attribute value. ' + e);
        }

        this.chartOptions = $.extend({}, this.chartOptions, parsedOptions);

        this.options = options;
        this.$el = $(element);
        this.fullDataSet = [];
        this.resetZoomLink = $(options.resetZoomLink);

        this.$el.trigger('oc.chartLineInit', [this]);

        /*
         * Bind Events
         */

        this.resetZoomLink.on('click', $.proxy(this.clearZoom, this));

        if (this.options.zoomable) {
            this.$el.on("plotselected", function (event, ranges) {
                var newCoords = {
                    xaxis: {min: ranges.xaxis.from, max: ranges.xaxis.to}
                };

                $.plot(self.$el, self.fullDataSet, $.extend(true, {}, self.chartOptions, newCoords));
                self.resetZoomLink.show()
            });
        }

        /*
         * Markings Helper
         */

        if (this.chartOptions.xaxis.mode == "time" && this.options.timeMode == "weeks")
            this.chartOptions.markings = weekendAreas;

        function weekendAreas(axes) {
            var markings = [],
                d = new Date(axes.xaxis.min);

            // Go to the first Saturday
            d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7));
            d.setUTCSeconds(0);
            d.setUTCMinutes(0);
            d.setUTCHours(0);
            var i = d.getTime();

            do {
                // When we don't set yaxis, the rectangle automatically
                // extends to infinity upwards and downwards
                markings.push({xaxis: {from: i, to: i + 2 * 24 * 60 * 60 * 1000}});
                i += 7 * 24 * 60 * 60 * 1000
            } while (i < axes.xaxis.max);

            return markings
        }

        /*
         * Process the datasets
         */

        this.initializing = true;

        this.$el.find('>[data-chart="dataset"]').each(function () {
            var data = $(this).data(),
                processedData = {};

            for (var key in data) {
                var normalizedKey = key.substring(3),
                    value = data[key];

                normalizedKey = normalizedKey.charAt(0).toLowerCase() + normalizedKey.slice(1);
                if (normalizedKey == 'data')
                    value = JSON.parse('[' + value + ']');

                processedData[normalizedKey] = value;
            }

            self.addDataSet($.extend({}, self.defaultDataSetOptions, processedData));
        });

        /*
         * Build chart
         */

        this.initializing = false;
        this.rebuildChart()
    };

    ChartLine.DEFAULTS = {
        chartOptions: "",
        timeMode: null,
        zoomable: false
    };

    /*
     * Adds a data set to the chart. 
     * See https://github.com/flot/flot/blob/master/API.md#data-format for the list
     * of supported data set options.
     */
    ChartLine.prototype.addDataSet = function (dataSet) {
        this.fullDataSet.push(dataSet);

        if (!this.initializing)
            this.rebuildChart()
    };

    ChartLine.prototype.rebuildChart = function () {
        this.$el.trigger('oc.beforeChartLineRender', [this]);

        $.plot(this.$el, this.fullDataSet, this.chartOptions)
    };

    ChartLine.prototype.clearZoom = function () {
        this.rebuildChart();
        this.resetZoomLink.hide()
    };

    // LINE CHART PLUGIN DEFINITION
    // ============================

    var old = $.fn.chartLine;

    $.fn.chartLine = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('october.chartLine');
            var options = $.extend({}, ChartLine.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('october.chartLine', (data = new ChartLine(this, options)));
            if (typeof option == 'string') data[option].call($this)
        })
    };

    $.fn.chartLine.Constructor = ChartLine;

    // LINE CHART NO CONFLICT
    // =================

    $.fn.chartLine.noConflict = function () {
        $.fn.chartLine = old;
        return this
    };


    // LINE CHART DATA-API
    // ===============
    $(document).on('render', function () {
        $('[data-control="chart-line"]').chartLine()
    })

}(window.jQuery);

/*
 * The bar chart plugin.
 *
 * Data attributes:
 * - data-control="chart-bar" - enables the bar chart plugin
 * - data-height="200" - optional, height of the graph
 * - data-full-width="1" - optional, determines whether the chart should use the full width of the container
 *
 * JavaScript API:
 * $('.scoreboard .chart').barChart()
 *
 * Dependences:
 * - Raphaël (raphael-min.js)
 */
+function ($) {
    "use strict";

    var BarChart = function (element, options) {
        this.options = options || {};

        var
            $el = this.$el = $(element),
            size = this.size = $el.height(),
            self = this,
            values = Storm.chartUtils.loadListValues($('ul', $el)),
            $legend = Storm.chartUtils.createLegend($('ul', $el)),
            indicators = Storm.chartUtils.initLegendColorIndicators($legend),
            isFullWidth = this.isFullWidth(),
            chartHeight = this.options.height !== undefined ? this.options.height : size,
            chartWidth = isFullWidth ? this.$el.width() : size,
            barWidth = (chartWidth - (values.values.length - 1) * this.options.gap) / values.values.length;

        var $canvas = $('<div/>').addClass('canvas').height(chartHeight).width(isFullWidth ? '100%' : chartWidth);
        $el.prepend($canvas);
        $el.toggleClass('full-width', isFullWidth);

        Raphael($canvas.get(0), isFullWidth ? '100%' : chartWidth, chartHeight, function () {
            self.paper = this;
            self.bars = this.set();

            self.paper.customAttributes.bar = function (start, height) {
                return {
                    path: [
                        ["M", start, chartHeight],
                        ["L", start, chartHeight - height],
                        ["L", start + barWidth, chartHeight - height],
                        ["L", start + barWidth, chartHeight],
                        ["Z"]
                    ]
                }
            };

            // Add bars
            var start = 0;
            $.each(values.values, function (index, valueInfo) {
                var color = valueInfo.color !== undefined ? valueInfo.color : Storm.chartUtils.getColor(index),
                    path = self.paper.path().attr({"stroke-width": 0}).attr({bar: [start, 0]}).attr({fill: color});

                self.bars.push(path);
                indicators[index].css('background-color', color);
                start += barWidth + self.options.gap;

                path.hover(function (ev) {
                    Storm.chartUtils.showTooltip(ev.pageX, ev.pageY,
                        $.trim(Storm.chartUtils.getLegendLabel($legend, index)) + ': <strong>' + valueInfo.value + '</stong>')
                }, function () {
                    Storm.chartUtils.hideTooltip()
                })
            });

            // Animate bars
            start = 0;
            $.each(values.values, function (index, valueInfo) {
                var height = (values.max && valueInfo.value) ? chartHeight / values.max * valueInfo.value : 0;

                self.bars[index].animate({bar: [start, height]}, 1000, "bounce");
                start += barWidth + self.options.gap
            });

            // Update the full-width chart when the window is redized
            if (isFullWidth) {
                $(window).on('resize', function () {
                    chartWidth = self.$el.width();
                    barWidth = (chartWidth - (values.values.length - 1) * self.options.gap) / values.values.length;

                    var start = 0;
                    $.each(values.values, function (index, valueInfo) {
                        var height = (values.max && valueInfo.value) ? chartHeight / values.max * valueInfo.value : 0;

                        self.bars[index].animate({bar: [start, height]}, 10, "bounce");
                        start += barWidth + self.options.gap
                    })
                })
            }
        })
    };

    BarChart.prototype.isFullWidth = function () {
        return this.options.hasOwnProperty('fullWidth') && this.options.fullWidth
    };

    BarChart.DEFAULTS = {
        gap: 2
    };

    // BARCHART PLUGIN DEFINITION
    // ============================

    var old = $.fn.barChart;

    $.fn.barChart = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.barChart');
            var options = $.extend({}, BarChart.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data)
                $this.data('oc.barChart', new BarChart(this, options))
        })
    };

    $.fn.barChart.Constructor = BarChart;

    // BARCHART NO CONFLICT
    // =================

    $.fn.barChart.noConflict = function () {
        $.fn.barChart = old;
        return this
    };

    // BARCHART DATA-API
    // ===============

    $(document).on('render', function () {
        $('[data-control=chart-bar]').barChart()
    })

}(window.jQuery);

/*
 * The pie chart plugin.
 * 
 * Data attributes:
 * - data-control="chart-pie" - enables the pie chart plugin
 * - data-size="200" - optional, size of the graph
 * - data-center-text - text to display inside the graph
 *
 * JavaScript API:
 * $('.scoreboard .chart').pieChart()
 *
 * Dependences:
 * - Raphaël (raphael-min.js)
 * - October chart utilities (chart.utils.js)
 */
+function ($) {
    "use strict";

    var PieChart = function (element, options) {
        this.options = options || {};

        var
            $el = this.$el = $(element),
            size = this.size = (this.options.size !== undefined ? this.options.size : $el.height()),
            outerRadius = size / 2 - 1,
            innerRadius = outerRadius - outerRadius / 3.5,
            values = Storm.chartUtils.loadListValues($('ul', $el)),
            $legend = Storm.chartUtils.createLegend($('ul', $el)),
            indicators = Storm.chartUtils.initLegendColorIndicators($legend),
            self = this;

        var $canvas = $('<div/>').addClass('canvas').width(size).height(size);
        $el.prepend($canvas);

        Raphael($canvas.get(0), size, size, function () {
            self.paper = this;
            self.segments = this.set();

            self.paper.customAttributes.segment = function (startAngle, endAngle) {
                var
                    p1 = self.arcCoords(outerRadius, startAngle),
                    p2 = self.arcCoords(outerRadius, endAngle),
                    p3 = self.arcCoords(innerRadius, endAngle),
                    p4 = self.arcCoords(innerRadius, startAngle),
                    flag = (endAngle - startAngle) > 180,
                    path = [
                        ["M", p1.x, p1.y],
                        ["A", outerRadius, outerRadius, 0, +flag, 0, p2.x, p2.y],
                        ["L", p3.x, p3.y],
                        ["A", innerRadius, innerRadius, 0, +flag, 1, p4.x, p4.y],
                        ["Z"]
                    ];

                return {path: path}
            };

            // Draw the background
            self.paper.circle(size / 2, size / 2, innerRadius + (outerRadius - innerRadius) / 2)
                .attr({"stroke-width": outerRadius - innerRadius - 0.5})
                .attr({stroke: Storm.chartUtils.defaultValueColor});

            // Add segments
            $.each(values.values, function (index, valueInfo) {
                var color = valueInfo.color !== undefined ? valueInfo.color : Storm.chartUtils.getColor(index),
                    path = self.paper.path().attr({"stroke-width": 0}).attr({segment: [0, 0]}).attr({fill: color});

                self.segments.push(path);
                indicators[index].css('background-color', color);

                path.hover(function (ev) {
                    Storm.chartUtils.showTooltip(ev.pageX, ev.pageY,
                        $.trim(Storm.chartUtils.getLegendLabel($legend, index)) + ': <strong>' + valueInfo.value + '</stong>')
                }, function () {
                    Storm.chartUtils.hideTooltip()
                })
            });

            // Animate segments
            var start = self.options.startAngle;
            $.each(values.values, function (index, valueInfo) {
                var length = (values.total && valueInfo.value) ? 360 / values.total * valueInfo.value : 0;
                if (length == 360)
                    length--;

                self.segments[index].animate({segment: [start, start + length]}, 1000, "bounce");
                start += length
            })
        });

        if (this.options.hasOwnProperty('centerText')) {
            var $text = $('<span>').addClass('center').html(this.options.centerText);
            $canvas.append($text)
        }
    };

    PieChart.prototype.arcCoords = function (radius, angle) {
        var
            a = Raphael.rad(angle),
            x = this.size / 2 + radius * Math.cos(a),
            y = this.size / 2 - radius * Math.sin(a);

        return {'x': x, 'y': y}
    };

    PieChart.DEFAULTS = {
        startAngle: 45
    };

    // PIECHART PLUGIN DEFINITION
    // ============================

    var old = $.fn.pieChart;

    $.fn.pieChart = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.pieChart');
            var options = $.extend({}, PieChart.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data)
                $this.data('oc.pieChart', new PieChart(this, options))
        })
    };

    $.fn.pieChart.Constructor = PieChart;

    // PIECHART NO CONFLICT
    // =================

    $.fn.pieChart.noConflict = function () {
        $.fn.pieChart = old;
        return this
    };

    // PIECHART DATA-API
    // ===============

    $(document).on('render', function () {
        $('[data-control=chart-pie]').pieChart()
    })

}(window.jQuery);
/*
 * The goal meter plugin. 
 *
 * Applies the goal meter style to a scoreboard item.
 * 
 * Data attributes:
 * - data-control="goal-meter" - enables the goal meter plugin
 * - data-value - sets the value, in percents
 *
 * JavaScript API:
 * $('.scoreboard .goal-meter').goalMeter({value: 20})
 * $('.scoreboard .goal-meter').goalMeter(10) // Sets the current value
 */
+function ($) {
    "use strict";

    var GoalMeter = function (element, options) {
        var
            $el = this.$el = $(element),
            self = this;

        this.options = options || {};

        this.$indicatorBar = $('<span/>').text(this.options.value + '%');
        this.$indicatorOuter = $('<span/>').addClass('goal-meter-indicator').append(this.$indicatorBar);

        $('p', this.$el).first().before(this.$indicatorOuter);

        window.setTimeout(function () {
            self.update(self.options.value)
        }, 200)
    };

    GoalMeter.prototype.update = function (value) {
        this.$indicatorBar.css('height', value + '%')
    };

    GoalMeter.DEFAULTS = {
        value: 50
    };

    // GOALMETER PLUGIN DEFINITION
    // ============================

    var old = $.fn.goalMeter;

    $.fn.goalMeter = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.goalMeter');
            var options = $.extend({}, GoalMeter.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data)
                $this.data('oc.goalMeter', (data = new GoalMeter(this, options)));
            else
                data.update(option)
        })
    };

    $.fn.goalMeter.Constructor = GoalMeter;

    // GOALMETER NO CONFLICT
    // =================

    $.fn.goalMeter.noConflict = function () {
        $.fn.goalMeter = old;
        return this
    };

    // GOALMETER DATA-API
    // ===============


    $(document).on('render', function () {
        $('[data-control=goal-meter]').goalMeter()
    })

}(window.jQuery);
/*
 * Table row linking plugin
 *
 * Data attributes:
 * - data-control="rowlink" - enables the plugin on an element
 * - data-exclude-class="nolink" - disables the link for elements with this class
 * - data-linked-class="rowlink" - this class is added to affected table rows
 *
 * JavaScript API:
 * $('a#someElement').rowLink()
 *
 * Dependences:
 * - Null
 */

+function ($) {
    "use strict";

    // ROWLINK CLASS DEFINITION
    // ============================

    var RowLink = function (element, options) {
        var self = this;
        this.options = options;
        this.$el = $(element);

        var tr = this.$el.prop('tagName') == 'TR'
            ? this.$el
            : this.$el.find('tr:has(td)');

        tr.each(function () {

            var link = $(this).find(options.target).filter(function () {
                return !$(this).closest('td').hasClass(options.excludeClass) && !$(this).hasClass(options.excludeClass)
            }).first();

            if (!link.length) return;

            var href = link.attr('href'),
                onclick = (typeof link.get(0).onclick == "function") ? link.get(0).onclick : null,
                popup = link.is('[data-control=popup]'),
                request = link.is('[data-request]');

            $(this).find('td').not('.' + options.excludeClass).click(function (e) {
                if ($(document.body).hasClass('drag')) {
                    return
                }

                if (onclick) {
                    onclick.apply(link.get(0))
                }
                else if (request) {
                    link.request()
                }
                else if (popup) {
                    link.popup()
                }
                else if (e.ctrlKey) {
                    window.open(href)
                }
                else {
                    window.location = href
                }
            });

            $(this).addClass(options.linkedClass);
            link.hide().after(link.html())
        })

    };

    RowLink.DEFAULTS = {
        target: 'a',
        excludeClass: 'nolink',
        linkedClass: 'rowlink'
    };

    // ROWLINK PLUGIN DEFINITION
    // ============================

    var old = $.fn.rowLink;

    $.fn.rowLink = function (option) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.rowlink');
            var options = $.extend({}, RowLink.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('oc.rowlink', (data = new RowLink(this, options)));
            else if (typeof option == 'string') data[option].apply(data, args)
        })
    };

    $.fn.rowLink.Constructor = RowLink;

    // ROWLINK NO CONFLICT
    // =================

    $.fn.rowLink.noConflict = function () {
        $.fn.rowLink = old;
        return this
    };

    // ROWLINK DATA-API
    // ===============

    $(document).on('render', function () {
        $('[data-control="rowlink"]').rowLink()
    })

}(window.jQuery);

/*
 * The form change monitor API.
 *
 * - Documentation: ../docs/input-monitor.md
 */
+function ($) {
    "use strict";

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var ChangeMonitor = function (element, options) {
        this.$el = $(element);

        this.paused = false;
        this.options = options || {};

        Storm.foundation.controlUtils.markDisposable(element);

        Base.call(this);

        this.init()
    };

    ChangeMonitor.prototype = Object.create(BaseProto);
    ChangeMonitor.prototype.constructor = ChangeMonitor;

    ChangeMonitor.prototype.init = function () {
        this.$el.on('change', this.proxy(this.change));
        this.$el.on('unchange.oc.changeMonitor', this.proxy(this.unchange));
        this.$el.on('pause.oc.changeMonitor', this.proxy(this.pause));
        this.$el.on('resume.oc.changeMonitor', this.proxy(this.resume));

        this.$el.on('keyup input paste', 'input, textarea:not(.ace_text-input)', this.proxy(this.onInputChange));
        $('input:not([type=hidden]), textarea:not(.ace_text-input)', this.$el).each(function () {
            $(this).data('oldval.oc.changeMonitor', $(this).val());
        });

        if (this.options.windowCloseConfirm)
            $(window).on('beforeunload', this.proxy(this.onBeforeUnload));

        this.$el.one('dispose-control', this.proxy(this.dispose));
        this.$el.trigger('ready.oc.changeMonitor')
    };

    ChangeMonitor.prototype.dispose = function () {
        if (this.$el === null)
            return;

        this.unregisterHandlers();

        this.$el.removeData('oc.changeMonitor');
        this.$el = null;
        this.options = null;

        BaseProto.dispose.call(this)
    };

    ChangeMonitor.prototype.unregisterHandlers = function () {
        this.$el.off('change', this.proxy(this.change));
        this.$el.off('unchange.oc.changeMonitor', this.proxy(this.unchange));
        this.$el.off('pause.oc.changeMonitor ', this.proxy(this.pause));
        this.$el.off('resume.oc.changeMonitor ', this.proxy(this.resume));
        this.$el.off('keyup input paste', 'input, textarea:not(.ace_text-input)', this.proxy(this.onInputChange));
        this.$el.off('dispose-control', this.proxy(this.dispose));

        if (this.options.windowCloseConfirm)
            $(window).off('beforeunload', this.proxy(this.onBeforeUnload))
    };

    ChangeMonitor.prototype.change = function (ev, inputChange) {
        if (this.paused)
            return;

        if (!inputChange) {
            var type = $(ev.target).attr('type');
            if (type == 'text' || type == "password")
                return
        }

        if (!this.$el.hasClass('oc-data-changed')) {
            this.$el.trigger('changed.oc.changeMonitor');
            this.$el.addClass('oc-data-changed')
        }
    };

    ChangeMonitor.prototype.unchange = function () {
        if (this.paused)
            return;

        if (this.$el.hasClass('oc-data-changed')) {
            this.$el.trigger('unchanged.oc.changeMonitor');
            this.$el.removeClass('oc-data-changed')
        }
    };

    ChangeMonitor.prototype.onInputChange = function (ev) {
        if (this.paused)
            return;

        var $el = $(ev.target);
        if ($el.data('oldval.oc.changeMonitor') != $el.val()) {

            $el.data('oldval.oc.changeMonitor', $el.val());
            this.change(ev, true);
        }
    };

    ChangeMonitor.prototype.pause = function () {
        this.paused = true
    };

    ChangeMonitor.prototype.resume = function () {
        this.paused = false
    };

    ChangeMonitor.prototype.onBeforeUnload = function () {
        if ($.contains(document.documentElement, this.$el.get(0)) && this.$el.hasClass('oc-data-changed'))
            return this.options.windowCloseConfirm
    };

    ChangeMonitor.DEFAULTS = {
        windowCloseConfirm: false
    };

    // CHANGEMONITOR PLUGIN DEFINITION
    // ===============================

    var old = $.fn.changeMonitor;

    $.fn.changeMonitor = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.changeMonitor');
            var options = $.extend({}, ChangeMonitor.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('oc.changeMonitor', (data = new ChangeMonitor(this, options)))
        })
    };

    $.fn.changeMonitor.Constructor = ChangeMonitor;

    // CHANGEMONITOR NO CONFLICT
    // ===============================

    $.fn.changeMonitor.noConflict = function () {
        $.fn.changeMonitor = old;
        return this
    };

    // CHANGEMONITOR DATA-API
    // ===============================

    $(document).on('render', function () {
        $('[data-change-monitor]').changeMonitor()
    })

}(window.jQuery);
/*
 * Hot key binding.
 * 
 * Data attributes:
 * - data-hotkey="ctrl+s, cmd+s" - enables the hotkey plugin
 *
 * JavaScript API:
 *
 * $('html').hotKey({ hotkey: 'ctrl+s, cmd+s', callback: doSomething);
 */
+function ($) {
    "use strict";

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var HotKey = function (element, options) {
        if (!options.hotkey)
            throw new Error('No hotkey has been defined.');

        this.$el = $(element);
        this.$target = $(options.hotkeyTarget);
        this.options = options || {};
        this.keyConditions = [];
        this.keyMap = null;

        Storm.foundation.controlUtils.markDisposable(element);

        Base.call(this);

        this.init()
    };

    HotKey.prototype = Object.create(BaseProto);
    HotKey.prototype.constructor = HotKey;

    HotKey.prototype.dispose = function () {
        if (this.$el === null)
            return;

        this.unregisterHandlers();

        this.$el.removeData('oc.hotkey');
        this.$target = null;
        this.$el = null;
        this.keyConditions = null;
        this.keyMap = null;
        this.options = null;

        BaseProto.dispose.call(this)
    };

    HotKey.prototype.init = function () {
        this.initKeyMap();

        var keys = this.options.hotkey.toLowerCase().split(',');

        for (var i = 0, len = keys.length; i < len; i++) {
            var keysTrimmed = this.trim(keys[i]);
            this.keyConditions.push(this.makeCondition(keysTrimmed))
        }

        this.$target.on('keydown', this.proxy(this.onKeyDown));
        this.$el.one('dispose-control', this.proxy(this.dispose))
    };

    HotKey.prototype.unregisterHandlers = function () {
        this.$target.off('keydown', this.proxy(this.onKeyDown));
        this.$el.off('dispose-control', this.proxy(this.dispose))
    };

    HotKey.prototype.makeCondition = function (keyBind) {
        var condition = {shift: false, ctrl: false, cmd: false, alt: false, specific: -1},
            keys = keyBind.split('+');

        for (var i = 0, len = keys.length; i < len; i++) {
            switch (keys[i]) {
                case 'shift':
                    condition.shift = true;
                    break;
                case 'ctrl':
                    condition.ctrl = true;
                    break;
                case 'command':
                case 'cmd':
                case 'meta':
                    condition.cmd = true;
                    break;
                case 'alt':
                    condition.alt = true;
                    break
            }
        }

        condition.specific = this.keyMap[keys[keys.length - 1]];

        if (typeof (condition.specific) == 'undefined')
            condition.specific = keys[keys.length - 1].toUpperCase().charCodeAt();

        return condition
    };

    HotKey.prototype.initKeyMap = function () {
        this.keyMap = {
            'esc': 27,
            'tab': 9,
            'space': 32,
            'return': 13,
            'enter': 13,
            'backspace': 8,
            'scroll': 145,
            'capslock': 20,
            'numlock': 144,
            'pause': 19,
            'break': 19,
            'insert': 45,
            'home': 36,
            'delete': 46,
            'suppr': 46,
            'end': 35,
            'pageup': 33,
            'pagedown': 34,
            'left': 37,
            'up': 38,
            'right': 39,
            'down': 40,
            'f1': 112,
            'f2': 113,
            'f3': 114,
            'f4': 115,
            'f5': 116,
            'f6': 117,
            'f7': 118,
            'f8': 119,
            'f9': 120,
            'f10': 121,
            'f11': 122,
            'f12': 123
        }
    };

    HotKey.prototype.trim = function (str) {
        return str
            .replace(/^\s+/, "")
            .replace(/\s+$/, "")
    };

    HotKey.prototype.testConditions = function (ev) {
        for (var i = 0, len = this.keyConditions.length; i < len; i++) {
            var condition = this.keyConditions[i];

            if (ev.which == condition.specific
                && ev.originalEvent.shiftKey == condition.shift
                && ev.originalEvent.ctrlKey == condition.ctrl
                && ev.originalEvent.metaKey == condition.cmd
                && ev.originalEvent.altKey == condition.alt) {
                return true
            }
        }

        return false
    };

    HotKey.prototype.onKeyDown = function (ev) {
        if (this.testConditions(ev)) {
            if (this.options.hotkeyVisible && !this.$el.is(':visible'))
                return;

            if (this.options.callback)
                return this.options.callback(this.$el, ev.currentTarget)
        }
    };

    HotKey.DEFAULTS = {
        hotkey: null,
        hotkeyTarget: 'html',
        hotkeyVisible: true,
        callback: function (element) {
            element.trigger('click');
            return false
        }
    };

    // HOTKEY PLUGIN DEFINITION
    // ============================

    var old = $.fn.hotKey;

    $.fn.hotKey = function (option) {
        var args = arguments;

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.hotkey');
            var options = $.extend({}, HotKey.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('oc.hotkey', (data = new HotKey(this, options)));
            if (typeof option == 'string') data[option].apply(data, args)
        })
    };

    $.fn.hotKey.Constructor = HotKey;

    // HOTKEY NO CONFLICT
    // =================

    $.fn.hotKey.noConflict = function () {
        $.fn.hotKey = old;
        return this
    };

    // HOTKEY DATA-API
    // ==============

    $(document).on('render', function () {
        $('[data-hotkey]').hotKey()
    })

}(window.jQuery);
/*
 * An input preset converter.
 *
 * The API allows to convert text entered into an element to a URL, slug or file name
 * value in another input element.
 *
 * Supported data attributes:
 * - data-input-preset: specifies a CSS selector for a source input element
 * - data-input-preset-closest-parent: optional, specifies a CSS selector for a closest common parent
 *   for the source and destination input elements.
 * - data-input-preset-type: specifies the conversion type. Supported values are:
 *   url, file, slug, camel.
 * - data-input-preset-prefix-input: optional, prefixes the converted value with the value found
 *   in the supplied input element using a CSS selector.
 *
 * Example: <input type="text" id="name" value=""/>
 *          <input type="text"
 *             data-input-preset="#name"
 *             data-input-preset-type="file">
 *
 * JavaScript API:
 * $('#filename').inputPreset({inputPreset: '#name', inputPresetType: 'file'})
 */
+function ($) {
    "use strict";

    var VIETNAMESE_MAP = {
            'Á': 'A',
            'À': 'A',
            'Ã': 'A',
            'Ả': 'A',
            'Ạ': 'A',
            'Ắ': 'A',
            'Ằ': 'A',
            'Ẵ': 'A',
            'Ẳ': 'A',
            'Ặ': 'A',
            'Ấ': 'A',
            'Ầ': 'A',
            'Ẫ': 'A',
            'Ẩ': 'A',
            'Ậ': 'A',
            'Đ': 'D',
            'É': 'E',
            'È': 'E',
            'Ẽ': 'E',
            'Ẻ': 'E',
            'Ẹ': 'E',
            'Ế': 'E',
            'Ề': 'E',
            'Ễ': 'E',
            'Ể': 'E',
            'Ệ': 'E',
            'Ó': 'O',
            'Ò': 'O',
            'Ỏ': 'O',
            'Õ': 'O',
            'Ọ': 'O',
            'Ố': 'O',
            'Ồ': 'O',
            'Ổ': 'O',
            'Ỗ': 'O',
            'Ộ': 'O',
            'Ớ': 'O',
            'Ờ': 'O',
            'Ở': 'O',
            'Ỡ': 'O',
            'Ợ': 'O',
            'Í': 'I',
            'Ì': 'I',
            'Ỉ': 'I',
            'Ĩ': 'I',
            'Ị': 'I',
            'Ú': 'U',
            'Ù': 'U',
            'Ủ': 'U',
            'Ũ': 'U',
            'Ụ': 'U',
            'Ứ': 'U',
            'Ừ': 'U',
            'Ử': 'U',
            'Ữ': 'U',
            'Ự': 'U',
            'Ý': 'Y',
            'Ỳ': 'Y',
            'Ỷ': 'Y',
            'Ỹ': 'Y',
            'Ỵ': 'Y',
            'á': 'a',
            'à': 'a',
            'ã': 'a',
            'ả': 'a',
            'ạ': 'a',
            'ắ': 'a',
            'ằ': 'a',
            'ẵ': 'a',
            'ẳ': 'a',
            'ặ': 'a',
            'ấ': 'a',
            'ầ': 'a',
            'ẫ': 'a',
            'ẩ': 'a',
            'ậ': 'a',
            'đ': 'd',
            'é': 'e',
            'è': 'e',
            'ẽ': 'e',
            'ẻ': 'e',
            'ẹ': 'e',
            'ế': 'e',
            'ề': 'e',
            'ễ': 'e',
            'ể': 'e',
            'ệ': 'e',
            'ó': 'o',
            'ò': 'o',
            'ỏ': 'o',
            'õ': 'o',
            'ọ': 'o',
            'ố': 'o',
            'ồ': 'o',
            'ổ': 'o',
            'ỗ': 'o',
            'ộ': 'o',
            'ớ': 'o',
            'ờ': 'o',
            'ở': 'o',
            'ỡ': 'o',
            'ợ': 'o',
            'í': 'i',
            'ì': 'i',
            'ỉ': 'i',
            'ĩ': 'i',
            'ị': 'i',
            'ú': 'u',
            'ù': 'u',
            'ủ': 'u',
            'ũ': 'u',
            'ụ': 'u',
            'ứ': 'u',
            'ừ': 'u',
            'ử': 'u',
            'ữ': 'u',
            'ự': 'u',
            'ý': 'y',
            'ỳ': 'y',
            'ỷ': 'y',
            'ỹ': 'y',
            'ỵ': 'y'
        },
        LATIN_MAP = {
            'À': 'A',
            'Á': 'A',
            'Â': 'A',
            'Ã': 'A',
            'Ä': 'A',
            'Å': 'A',
            'Æ': 'AE',
            'Ç': 'C',
            'È': 'E',
            'É': 'E',
            'Ê': 'E',
            'Ë': 'E',
            'Ì': 'I',
            'Í': 'I',
            'Î': 'I',
            'Ï': 'I',
            'Ð': 'D',
            'Ñ': 'N',
            'Ò': 'O',
            'Ó': 'O',
            'Ô': 'O',
            'Õ': 'O',
            'Ö': 'O',
            'Ő': 'O',
            'Ø': 'O',
            'Ù': 'U',
            'Ú': 'U',
            'Û': 'U',
            'Ü': 'U',
            'Ű': 'U',
            'Ý': 'Y',
            'Þ': 'TH',
            'Ÿ': 'Y',
            'ß': 'ss',
            'à': 'a',
            'á': 'a',
            'â': 'a',
            'ã': 'a',
            'ä': 'a',
            'å': 'a',
            'æ': 'ae',
            'ç': 'c',
            'è': 'e',
            'é': 'e',
            'ê': 'e',
            'ë': 'e',
            'ì': 'i',
            'í': 'i',
            'î': 'i',
            'ï': 'i',
            'ð': 'd',
            'ñ': 'n',
            'ò': 'o',
            'ó': 'o',
            'ô': 'o',
            'õ': 'o',
            'ö': 'o',
            'ő': 'o',
            'ø': 'o',
            'ō': 'o',
            'œ': 'oe',
            'ù': 'u',
            'ú': 'u',
            'û': 'u',
            'ü': 'u',
            'ű': 'u',
            'ý': 'y',
            'þ': 'th',
            'ÿ': 'y'
        },
        LATIN_SYMBOLS_MAP = {
            '©': '(c)'
        },
        GREEK_MAP = {
            'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': '8',
            'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': '3', 'ο': 'o', 'π': 'p',
            'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'x', 'ψ': 'ps', 'ω': 'w',
            'ά': 'a', 'έ': 'e', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ή': 'h', 'ώ': 'w', 'ς': 's',
            'ϊ': 'i', 'ΰ': 'y', 'ϋ': 'y', 'ΐ': 'i',
            'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Θ': '8',
            'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': '3', 'Ο': 'O', 'Π': 'P',
            'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'X', 'Ψ': 'PS', 'Ω': 'W',
            'Ά': 'A', 'Έ': 'E', 'Ί': 'I', 'Ό': 'O', 'Ύ': 'Y', 'Ή': 'H', 'Ώ': 'W', 'Ϊ': 'I',
            'Ϋ': 'Y'
        },
        TURKISH_MAP = {
            'ş': 's', 'Ş': 'S', 'ı': 'i', 'İ': 'I', 'ç': 'c', 'Ç': 'C', 'ü': 'u', 'Ü': 'U',
            'ö': 'o', 'Ö': 'O', 'ğ': 'g', 'Ğ': 'G'
        },
        RUSSIAN_MAP = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
            'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
            'я': 'ya',
            'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
            'З': 'Z', 'И': 'I', 'Й': 'J', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
            'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
            'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
            'Я': 'Ya'
        },
        UKRAINIAN_MAP = {
            'Є': 'Ye', 'І': 'I', 'Ї': 'Yi', 'Ґ': 'G', 'є': 'ye', 'і': 'i', 'ї': 'yi', 'ґ': 'g'
        },
        CZECH_MAP = {
            'č': 'c', 'ď': 'd', 'ě': 'e', 'ň': 'n', 'ř': 'r', 'š': 's', 'ť': 't', 'ů': 'u',
            'ž': 'z', 'Č': 'C', 'Ď': 'D', 'Ě': 'E', 'Ň': 'N', 'Ř': 'R', 'Š': 'S', 'Ť': 'T',
            'Ů': 'U', 'Ž': 'Z'
        },
        POLISH_MAP = {
            'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z',
            'ż': 'z', 'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S',
            'Ź': 'Z', 'Ż': 'Z'
        },
        LATVIAN_MAP = {
            'ā': 'a', 'č': 'c', 'ē': 'e', 'ģ': 'g', 'ī': 'i', 'ķ': 'k', 'ļ': 'l', 'ņ': 'n',
            'š': 's', 'ū': 'u', 'ž': 'z', 'Ā': 'A', 'Č': 'C', 'Ē': 'E', 'Ģ': 'G', 'Ī': 'I',
            'Ķ': 'K', 'Ļ': 'L', 'Ņ': 'N', 'Š': 'S', 'Ū': 'U', 'Ž': 'Z'
        },
        ARABIC_MAP = {
            'أ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g', 'ح': 'h', 'خ': 'kh', 'د': 'd',
            'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't',
            'ظ': 'th', 'ع': 'aa', 'غ': 'gh', 'ف': 'f', 'ق': 'k', 'ك': 'k', 'ل': 'l', 'م': 'm',
            'ن': 'n', 'ه': 'h', 'و': 'o', 'ي': 'y'
        },
        PERSIAN_MAP = {
            'آ': 'a', 'ا': 'a', 'پ': 'p', 'چ': 'ch', 'ژ': 'zh', 'ک': 'k', 'گ': 'gh', 'ی': 'y'
        },
        LITHUANIAN_MAP = {
            'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i', 'š': 's', 'ų': 'u', 'ū': 'u',
            'ž': 'z',
            'Ą': 'A', 'Č': 'C', 'Ę': 'E', 'Ė': 'E', 'Į': 'I', 'Š': 'S', 'Ų': 'U', 'Ū': 'U',
            'Ž': 'Z'
        },
        SERBIAN_MAP = {
            'ђ': 'dj', 'ј': 'j', 'љ': 'lj', 'њ': 'nj', 'ћ': 'c', 'џ': 'dz', 'đ': 'dj',
            'Ђ': 'Dj', 'Ј': 'j', 'Љ': 'Lj', 'Њ': 'Nj', 'Ћ': 'C', 'Џ': 'Dz', 'Đ': 'Dj'
        },
        AZERBAIJANI_MAP = {
            'ç': 'c', 'ə': 'e', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
            'Ç': 'C', 'Ə': 'E', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
        },
        ROMANIAN_MAP = {
            'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
            'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T'
        },
        SPECIFIC_MAPS = {
            'de': {
                'Ä': 'AE', 'Ö': 'OE', 'Ü': 'UE',
                'ä': 'ae', 'ö': 'oe', 'ü': 'ue'
            }
        },
        ALL_MAPS = [
            VIETNAMESE_MAP,
            LATIN_MAP,
            LATIN_SYMBOLS_MAP,
            GREEK_MAP,
            TURKISH_MAP,
            RUSSIAN_MAP,
            UKRAINIAN_MAP,
            CZECH_MAP,
            POLISH_MAP,
            LATVIAN_MAP,
            ARABIC_MAP,
            PERSIAN_MAP,
            LITHUANIAN_MAP,
            SERBIAN_MAP,
            AZERBAIJANI_MAP,
            ROMANIAN_MAP
        ];

    var removeList = [
        "a", "an", "as", "at", "before", "but", "by", "for", "from", "is",
        "in", "into", "like", "of", "off", "on", "onto", "per", "since",
        "than", "the", "this", "that", "to", "up", "via", "with"
    ];

    var locale = $('meta[name="backend-locale"]').attr('content');

    var Downcoder = {
        Initialize: function () {
            if (Downcoder.map) {
                return;
            }
            Downcoder.map = {};
            Downcoder.chars = [];
            if (typeof SPECIFIC_MAPS[locale] === 'object') {
                ALL_MAPS.push(SPECIFIC_MAPS[locale]);
            }
            for (var i = 0; i < ALL_MAPS.length; i++) {
                var lookup = ALL_MAPS[i];
                for (var c in lookup) {
                    if (lookup.hasOwnProperty(c)) {
                        Downcoder.map[c] = lookup[c];
                    }
                }
            }
            for (var k in Downcoder.map) {
                if (Downcoder.map.hasOwnProperty(k)) {
                    Downcoder.chars.push(k);
                }
            }
            Downcoder.regex = new RegExp(Downcoder.chars.join('|'), 'g');
        }
    };

    function toCamel(slug, numChars) {

        Downcoder.Initialize();
        slug = slug.replace(Downcoder.regex, function (m) {
            return Downcoder.map[m]
        });

        var regex = new RegExp('\\b(' + removeList.join('|') + ')\\b', 'gi');
        slug = slug.replace(regex, '');
        slug = slug.toLowerCase();
        slug = slug.replace(/(\b|-)\w/g, function (m) {
            return m.toUpperCase();
        });
        slug = slug.replace(/[^-\w\s]/g, '');
        slug = slug.replace(/^\s+|\s+$/g, '');
        slug = slug.replace(/[-\s]+/g, '');
        slug = slug.substr(0, 1).toLowerCase() + slug.substr(1);
        return slug.substring(0, numChars)
    }

    function slugify(slug, numChars) {

        Downcoder.Initialize();
        slug = slug.replace(Downcoder.regex, function (m) {
            return Downcoder.map[m]
        });

        var regex = new RegExp('\\b(' + removeList.join('|') + ')\\b', 'gi');
        slug = slug.replace(regex, '');
        slug = slug.replace(/[^-\w\s]/g, '');
        slug = slug.replace(/^\s+|\s+$/g, '');
        slug = slug.replace(/[-\s]+/g, '-');
        slug = slug.toLowerCase();
        return slug.substring(0, numChars)
    }

    var InputPreset = function (element, options) {
        var $el = this.$el = $(element);
        this.options = options || {};
        this.cancelled = false;

        var parent = options.inputPresetClosestParent !== undefined
                ? $el.closest(options.inputPresetClosestParent)
                : undefined,
            self = this,
            prefix = '';

        if (options.inputPresetPrefixInput !== undefined)
            prefix = $(options.inputPresetPrefixInput, parent).val();

        if (prefix === undefined)
            prefix = '';

        // Do not update the element if it already has a value and the value doesn't match the prefix
        if ($el.val().length && $el.val() != prefix)
            return;

        $el.val(prefix).trigger('oc.inputPreset.afterUpdate');

        this.$src = $(options.inputPreset, parent);
        this.$src.on('keyup', function () {
            if (self.cancelled)
                return;

            $el.val(prefix + self.formatValue()).trigger('oc.inputPreset.afterUpdate')
        });

        this.$el.on('change', function () {
            self.cancelled = true
        })
    };

    InputPreset.prototype.formatNamespace = function () {
        var value = toCamel(this.$src.val());

        return value.substr(0, 1).toUpperCase() + value.substr(1)
    };

    InputPreset.prototype.formatValue = function () {
        if (this.options.inputPresetType == 'exact') {
            return this.$src.val();
        }
        else if (this.options.inputPresetType == 'namespace') {
            return this.formatNamespace()
        }

        if (this.options.inputPresetType == 'camel') {
            var value = toCamel(this.$src.val())
        }
        else {
            var value = slugify(this.$src.val())
        }

        if (this.options.inputPresetType == 'url') {
            value = '/' + value
        }

        return value.replace(/\s/gi, "-")
    };

    InputPreset.DEFAULTS = {
        inputPreset: '',
        inputPresetType: 'slug',
        inputPresetClosestParent: undefined,
        inputPresetPrefixInput: undefined
    };

    // INPUT CONVERTER PLUGIN DEFINITION
    // ============================

    var old = $.fn.inputPreset;

    $.fn.inputPreset = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.inputPreset');
            var options = $.extend({}, InputPreset.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('oc.inputPreset', (data = new InputPreset(this, options)))
        })
    };

    $.fn.inputPreset.Constructor = InputPreset;

    // INPUT CONVERTER NO CONFLICT
    // =================

    $.fn.inputPreset.noConflict = function () {
        $.fn.inputPreset = old;
        return this
    };

    // INPUT CONVERTER DATA-API
    // ===============

    $(document).on('render', function () {
        $('[data-input-preset]').inputPreset()
    })

}(window.jQuery);

/*
 * The trigger API
 *
 * - Documentation: ../docs/input-trigger.md
 */
+function ($) {
    "use strict";

    var TriggerOn = function (element, options) {

        var $el = this.$el = $(element);

        this.options = options || {};

        if (this.options.triggerCondition === false)
            throw new Error('Trigger condition is not specified.');

        if (this.options.trigger === false)
            throw new Error('Trigger selector is not specified.');

        if (this.options.triggerAction === false)
            throw new Error('Trigger action is not specified.');

        this.triggerCondition = this.options.triggerCondition;

        if (this.options.triggerCondition.indexOf('value') == 0) {
            var match = this.options.triggerCondition.match(/[^[\]]+(?=])/g);
            this.triggerCondition = 'value';
            this.triggerConditionValue = (match) ? match : [""]
        }

        this.triggerParent = this.options.triggerClosestParent !== undefined
            ? $el.closest(this.options.triggerClosestParent)
            : undefined;

        if (
            this.triggerCondition == 'checked' ||
            this.triggerCondition == 'unchecked' ||
            this.triggerCondition == 'value'
        ) {
            $(document).on('change', this.options.trigger, $.proxy(this.onConditionChanged, this))
        }

        var self = this;
        $el.on('oc.triggerOn.update', function (e) {
            e.stopPropagation();
            self.onConditionChanged()
        });

        self.onConditionChanged()
    };

    TriggerOn.prototype.onConditionChanged = function () {
        if (this.triggerCondition == 'checked') {
            this.updateTarget(!!$(this.options.trigger + ':checked', this.triggerParent).length)
        }
        else if (this.triggerCondition == 'unchecked') {
            this.updateTarget(!$(this.options.trigger + ':checked', this.triggerParent).length)
        }
        else if (this.triggerCondition == 'value') {
            var trigger, triggerValue = '';

            trigger = $(this.options.trigger, this.triggerParent)
                .not('input[type=checkbox], input[type=radio], input[type=button], input[type=submit]');

            if (!trigger.length) {
                trigger = $(this.options.trigger, this.triggerParent)
                    .not(':not(input[type=checkbox]:checked, input[type=radio]:checked)')
            }

            if (!!trigger.length) {
                triggerValue = trigger.val()
            }

            this.updateTarget($.inArray(triggerValue, this.triggerConditionValue) != -1)
        }
    };

    TriggerOn.prototype.updateTarget = function (status) {
        var self = this,
            actions = this.options.triggerAction.split('|');

        $.each(actions, function (index, action) {
            self.updateTargetAction(action, status)
        });

        $(window).trigger('resize');

        this.$el.trigger('oc.triggerOn.afterUpdate', status)
    };

    TriggerOn.prototype.updateTargetAction = function (action, status) {
        if (action == 'show') {
            this.$el
                .toggleClass('hide', !status)
                .trigger('hide.oc.triggerapi', [!status])
        }
        else if (action == 'hide') {
            this.$el
                .toggleClass('hide', status)
                .trigger('hide.oc.triggerapi', [status])
        }
        else if (action == 'enable') {
            this.$el
                .prop('disabled', !status)
                .toggleClass('control-disabled', !status)
                .trigger('disable.oc.triggerapi', [!status])
        }
        else if (action == 'disable') {
            this.$el
                .prop('disabled', status)
                .toggleClass('control-disabled', status)
                .trigger('disable.oc.triggerapi', [status])
        }
        else if (action == 'empty' && status) {
            this.$el
                .not('input[type=checkbox], input[type=radio], input[type=button], input[type=submit]')
                .val('');

            this.$el
                .not(':not(input[type=checkbox], input[type=radio])')
                .prop('checked', false);

            this.$el
                .trigger('empty.oc.triggerapi')
                .trigger('change')
        }

        if (action == 'show' || action == 'hide') {
            this.fixButtonClasses()
        }
    };

    TriggerOn.prototype.fixButtonClasses = function () {
        var group = this.$el.closest('.btn-group');

        if (group.length > 0 && this.$el.is(':last-child'))
            this.$el.prev().toggleClass('last', this.$el.hasClass('hide'))
    };

    TriggerOn.DEFAULTS = {
        triggerAction: false,
        triggerCondition: false,
        triggerClosestParent: undefined,
        trigger: false
    };

    // TRIGGERON PLUGIN DEFINITION
    // ============================

    var old = $.fn.triggerOn;

    $.fn.triggerOn = function (option) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.triggerOn');
            var options = $.extend({}, TriggerOn.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('oc.triggerOn', (data = new TriggerOn(this, options)))
        })
    };

    $.fn.triggerOn.Constructor = TriggerOn;

    // TRIGGERON NO CONFLICT
    // =================

    $.fn.triggerOn.noConflict = function () {
        $.fn.triggerOn = old;
        return this
    };

    // TRIGGERON DATA-API
    // ===============

    $(document).on('render', function () {
        $('[data-trigger]').triggerOn()
    })

}(window.jQuery);

/*
 * Drag Value plugin
 *
 * Uses native dragging to allow elements to be dragged in to inputs, textareas, etc
 *
 * Data attributes:
 * - data-control="dragvalue" - enables the plugin on an element
 * - data-text-value="text to include" - text value to include when dragging
 * - data-drag-click="false" - allow click event, tries to cache the last active element
 *                             and insert the text at the current cursor position
 *
 * JavaScript API:
 * $('a#someElement').dragValue({ textValue: 'insert this text' })
 *
 */

+function ($) {
    "use strict";

    // DRAG VALUE CLASS DEFINITION
    // ============================

    var DragValue = function (element, options) {
        this.options = options;
        this.$el = $(element);

        // Init
        this.init()
    };

    DragValue.DEFAULTS = {
        dragClick: false
    };

    DragValue.prototype.init = function () {
        this.$el.prop('draggable', true);
        this.textValue = this.$el.data('textValue');

        this.$el.on('dragstart', $.proxy(this.handleDragStart, this));
        this.$el.on('drop', $.proxy(this.handleDrop, this));
        this.$el.on('dragend', $.proxy(this.handleDragEnd, this));

        if (this.options.dragClick) {
            this.$el.on('click', $.proxy(this.handleClick, this));
            this.$el.on('mouseover', $.proxy(this.handleMouseOver, this))
        }
    };

    //
    // Drag events
    //

    DragValue.prototype.handleDragStart = function (event) {
        var e = event.originalEvent;
        e.dataTransfer.effectAllowed = 'all';
        e.dataTransfer.setData('text/plain', this.textValue);

        this.$el
            .css({opacity: 0.5})
            .addClass('dragvalue-dragging')
    };

    DragValue.prototype.handleDrop = function (event) {
        event.stopPropagation();
        return false
    };

    DragValue.prototype.handleDragEnd = function (event) {
        this.$el
            .css({opacity: 1})
            .removeClass('dragvalue-dragging')
    };

    //
    // Click events
    //

    DragValue.prototype.handleMouseOver = function (event) {
        var el = document.activeElement;
        if (!el) return;

        if (el.isContentEditable || (
                el.tagName.toLowerCase() == 'input' &&
                el.type == 'text' ||
                el.tagName.toLowerCase() == 'textarea'
            )) {
            this.lastElement = el
        }
    };

    DragValue.prototype.handleClick = function (event) {
        if (!this.lastElement) return;

        var $el = $(this.lastElement);

        if ($el.hasClass('ace_text-input'))
            return this.handleClickCodeEditor(event, $el);

        if (this.lastElement.isContentEditable)
            return this.handleClickContentEditable();

        this.insertAtCaret(this.lastElement, this.textValue)
    };

    DragValue.prototype.handleClickCodeEditor = function (event, $el) {
        var $editorArea = $el.closest('[data-control=codeeditor]');
        if (!$editorArea.length) return;

        $editorArea.codeEditor('getEditorObject').insert(this.textValue)
    };

    DragValue.prototype.handleClickContentEditable = function () {
        var sel, range, html;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(this.textValue));
            }
        }
        else if (document.selection && document.selection.createRange) {
            document.selection.createRange().text = this.textValue;
        }
    };

    //
    // Helpers
    //

    DragValue.prototype.insertAtCaret = function (el, insertValue) {
        // IE
        if (document.selection) {
            el.focus();
            var sel = document.selection.createRange();
            sel.text = insertValue;
            el.focus()
        }
        // Real browsers
        else if (el.selectionStart || el.selectionStart == '0') {
            var startPos = el.selectionStart, endPos = el.selectionEnd, scrollTop = el.scrollTop;
            el.value = el.value.substring(0, startPos) + insertValue + el.value.substring(endPos, el.value.length);
            el.focus();
            el.selectionStart = startPos + insertValue.length;
            el.selectionEnd = startPos + insertValue.length;
            el.scrollTop = scrollTop
        }
        else {
            el.value += insertValue;
            el.focus()
        }
    };

    // DRAG VALUE PLUGIN DEFINITION
    // ============================

    var old = $.fn.dragValue;

    $.fn.dragValue = function (option) {
        var args = Array.prototype.slice.call(arguments, 1), result;
        this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.dragvalue');
            var options = $.extend({}, DragValue.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('oc.dragvalue', (data = new DragValue(this, options)));
            if (typeof option == 'string') result = data[option].apply(data, args);
            if (typeof result != 'undefined') return false
        });

        return result ? result : this
    };

    $.fn.dragValue.Constructor = DragValue;

    // DRAG VALUE NO CONFLICT
    // =================

    $.fn.dragValue.noConflict = function () {
        $.fn.dragValue = old;
        return this
    };

    // DRAG VALUE DATA-API
    // ===============

    $(document).on('render', function () {
        $('[data-control="dragvalue"]').dragValue()
    });

}(window.jQuery);
/*
 * Sortable plugin.
 *
 * Documentation: ../docs/drag-sort.md
 *
 * Require:
 *  - sortable/jquery-sortable
 */

+function ($) {
    "use strict";

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var Sortable = function (element, options) {
        this.$el = $(element);
        this.options = options || {};
        this.cursorAdjustment = null;

        Storm.foundation.controlUtils.markDisposable(element);
        Base.call(this);
        this.init()
    };

    Sortable.prototype = Object.create(BaseProto);
    Sortable.prototype.constructor = Sortable;

    Sortable.prototype.init = function () {
        this.$el.one('dispose-control', this.proxy(this.dispose));

        var
            self = this,
            sortableOverrides = {},
            sortableDefaults = {
                onDragStart: this.proxy(this.onDragStart),
                onDrag: this.proxy(this.onDrag),
                onDrop: this.proxy(this.onDrop)
            };

        /*
         * Override _super object for each option/event
         */
        if (this.options.onDragStart) {
            sortableOverrides.onDragStart = function ($item, container, _super, event) {
                self.options.onDragStart($item, container, sortableDefaults.onDragStart, event)
            }
        }

        if (this.options.onDrag) {
            sortableOverrides.onDrag = function ($item, position, _super, event) {
                self.options.onDrag($item, position, sortableDefaults.onDrag, event)
            }
        }

        if (this.options.onDrop) {
            sortableOverrides.onDrop = function ($item, container, _super, event) {
                self.options.onDrop($item, container, sortableDefaults.onDrop, event)
            }
        }

        this.$el.jqSortable($.extend({}, sortableDefaults, this.options, sortableOverrides))
    };

    Sortable.prototype.dispose = function () {
        this.$el.jqSortable('destroy');
        this.$el.off('dispose-control', this.proxy(this.dispose));
        this.$el.removeData('oc.sortable');
        this.$el = null;
        this.options = null;
        this.cursorAdjustment = null;
        BaseProto.dispose.call(this)
    };

    Sortable.prototype.onDragStart = function ($item, container, _super, event) {
        /*
         * Relative cursor position
         */
        var offset = $item.offset(),
            pointer = container.rootGroup.pointer;

        if (pointer) {
            this.cursorAdjustment = {
                left: pointer.left - offset.left,
                top: pointer.top - offset.top
            }
        }
        else {
            this.cursorAdjustment = null
        }

        if (this.options.tweakCursorAdjustment) {
            this.cursorAdjustment = this.options.tweakCursorAdjustment(this.cursorAdjustment)
        }

        $item.css({
            height: $item.height(),
            width: $item.width()
        });

        $item.addClass('dragged');
        $('body').addClass('dragging');
        this.$el.addClass('dragging');

        /*
         * Use animation
         */
        if (this.options.useAnimation) {
            $item.data('oc.animated', true)
        }

        /*
         * Placeholder clone
         */
        if (this.options.usePlaceholderClone) {
            $(container.rootGroup.placeholder).html($item.html())
        }

        if (!this.options.useDraggingClone) {
            $item.hide()
        }
    };

    Sortable.prototype.onDrag = function ($item, position, _super, event) {
        if (this.cursorAdjustment) {
            /*
             * Relative cursor position
             */
            $item.css({
                left: position.left - this.cursorAdjustment.left,
                top: position.top - this.cursorAdjustment.top
            })
        }
        else {
            /*
             * Default behavior
             */
            $item.css(position)
        }
    };

    Sortable.prototype.onDrop = function ($item, container, _super, event) {
        $item.removeClass('dragged').removeAttr('style');
        $('body').removeClass('dragging');
        this.$el.removeClass('dragging');

        if ($item.data('oc.animated')) {
            $item
                .hide()
                .slideDown(200)
        }
    };

    //
    // Proxy API
    //

    Sortable.prototype.enable = function () {
        this.$el.jqSortable('enable')
    };

    Sortable.prototype.disable = function () {
        this.$el.jqSortable('disable')
    };

    Sortable.prototype.refresh = function () {
        this.$el.jqSortable('refresh')
    };

    Sortable.prototype.serialize = function () {
        this.$el.jqSortable('serialize')
    };

    Sortable.prototype.destroy = function () {
        this.dispose()
    };

    // External solution for group persistence
    // See https://github.com/johnny/jquery-sortable/pull/122
    Sortable.prototype.destroyGroup = function () {
        var jqSortable = this.$el.data('jqSortable');
        if (jqSortable.group) {
            jqSortable.group._destroy()
        }
    };

    Sortable.DEFAULTS = {
        useAnimation: false,
        usePlaceholderClone: false,
        useDraggingClone: true,
        tweakCursorAdjustment: null
    };

    // PLUGIN DEFINITION
    // ============================

    var old = $.fn.sortable;

    $.fn.sortable = function (option) {
        var args = arguments;

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.sortable');
            var options = $.extend({}, Sortable.DEFAULTS, $this.data(), typeof option == 'object' && option);
            if (!data) $this.data('oc.sortable', (data = new Sortable(this, options)));
            if (typeof option == 'string') data[option].apply(data, args)
        })
    };

    $.fn.sortable.Constructor = Sortable;

    $.fn.sortable.noConflict = function () {
        $.fn.sortable = old;
        return this
    }

}(window.jQuery);

/*
 * Allows to scroll an element content in the horizontal or horizontal directions. This script doesn't use
 * absolute positioning and rely on the scrollLeft/scrollTop DHTML properties. The element width should be
 * fixed with the CSS or JavaScript.
 *
 * Events triggered on the element:
 * - start.oc.dragScroll
 * - drag.oc.dragScroll
 * - stop.oc.dragScroll
 *
 * Options:
 * - start - callback function to execute when the drag starts
 * - drag - callback function to execute when the element is dragged
 * - stop - callback function to execute when the drag ends
 * - vertical - determines if the scroll direction is vertical, true by default
 * - scrollClassContainer - if specified, specifies an element or element selector to apply the 'scroll-before' and 'scroll-after' CSS classes,
 *   depending on whether the scrollable area is in its start or end
 * - scrollMarkerContainer - if specified, specifies an element or element selector to inject scroll markers (span elements that con 
 *   contain the ellipses icon, indicating whether scrolling is possible)
 * - useDrag - determines if dragging is allowed support, true by default
 * - useScroll - determines if the mouse wheel scrolling is allowed, true by default
 * - useComboScroll - determines if horizontal scroll should act as vertical, and vice versa, true by default
 * - dragSelector - restrict drag events to this selector
 * - scrollSelector - restrict scroll events to this selector
 *
 * Methods:
 * - isStart - determines if the scrollable area is in its start (left or top)
 * - isEnd - determines if the scrollable area is in its end (right or bottom)
 * - goToStart - moves the scrollable area to the start (left or top)
 * - goToElement - moves the scrollable area to an element
 *
 * Require:
 * - modernizr/modernizr
 * - mousewheel/mousewheel
 */
+function ($) {
    "use strict";

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var DragScroll = function (element, options) {
        this.options = $.extend({}, DragScroll.DEFAULTS, options);

        var
            $el = $(element),
            el = $el.get(0),
            dragStart = 0,
            startOffset = 0,
            self = this,
            dragging = false,
            eventElementName = this.options.vertical ? 'pageY' : 'pageX';

        this.el = $el;
        this.scrollClassContainer = this.options.scrollClassContainer ? $(this.options.scrollClassContainer) : $el;
        this.isScrollable = true;

        Base.call(this);

        /*
         * Inject scroll markers
         */
        if (this.options.scrollMarkerContainer) {
            $(this.options.scrollMarkerContainer)
                .append($('<span class="before scroll-marker"></span><span class="after scroll-marker"></span>'))
        }

        /*
         * Bind events
         */
        var $scrollSelect = this.options.scrollSelector ? $(this.options.scrollSelector, $el) : $el;

        $scrollSelect.mousewheel(function (event) {
            if (!self.options.useScroll)
                return;

            var offset,
                offsetX = event.deltaFactor * event.deltaX,
                offsetY = event.deltaFactor * event.deltaY;

            if (!offsetX && self.options.useComboScroll) {
                offset = offsetY * -1
            }
            else if (!offsetY && self.options.useComboScroll) {
                offset = offsetX
            }
            else {
                offset = self.options.vertical ? (offsetY * -1) : offsetX
            }

            return !scrollWheel(offset)
        });

        if (this.options.useDrag) {
            $el.on('mousedown.dragScroll', this.options.dragSelector, function (event) {
                if (event.target && event.target.tagName === 'INPUT')
                    return; // Don't prevent clicking inputs in the toolbar

                if (!self.isScrollable)
                    return;

                startDrag(event);
                return false
            })
        }

        $el.on('touchstart.dragScroll', this.options.dragSelector, function (event) {
            var touchEvent = event.originalEvent;
            if (touchEvent.touches.length == 1) {
                startDrag(touchEvent.touches[0]);
                event.stopPropagation()
            }
        });

        $el.on('click.dragScroll', function () {
            // Do not handle item clicks while dragging
            if ($(document.body).hasClass(self.options.dragClass))
                return false
        });

        $(document).on('ready', this.proxy(this.fixScrollClasses));
        $(window).on('resize', this.proxy(this.fixScrollClasses));

        /*
         * Internal event, drag has started
         */
        function startDrag(event) {
            dragStart = event[eventElementName];
            startOffset = self.options.vertical ? $el.scrollTop() : $el.scrollLeft();

            if (Modernizr.touch) {
                $(window).on('touchmove.dragScroll', function (event) {
                    var touchEvent = event.originalEvent;
                    moveDrag(touchEvent.touches[0]);
                    event.preventDefault()
                });

                $(window).on('touchend.dragScroll', function (event) {
                    stopDrag()
                })
            }
            else {
                $(window).on('mousemove.dragScroll', function (event) {
                    moveDrag(event);
                    return false
                });

                $(window).on('mouseup.dragScroll', function (mouseUpEvent) {
                    var isClick = event.pageX == mouseUpEvent.pageX && event.pageY == mouseUpEvent.pageY;
                    stopDrag(isClick);
                    return false
                })
            }
        }

        /*
         * Internal event, drag is active
         */
        function moveDrag(event) {
            var current = event[eventElementName],
                offset = dragStart - current;

            if (Math.abs(offset) > 3) {
                if (!dragging) {
                    dragging = true;
                    $el.trigger('start.oc.dragScroll');
                    self.options.start();
                    $(document.body).addClass(self.options.dragClass)
                }

                self.options.vertical
                    ? $el.scrollTop(startOffset + offset)
                    : $el.scrollLeft(startOffset + offset);

                $el.trigger('drag.oc.dragScroll');
                self.options.drag()
            }
        }

        /*
         * Internal event, drag has ended
         */
        function stopDrag(click) {
            $(window).off('.dragScroll');

            dragging = false;

            if (click) {
                $(document.body).removeClass(self.options.dragClass)
            }
            else {
                self.fixScrollClasses()
            }

            window.setTimeout(function () {
                if (!click) {
                    $(document.body).removeClass(self.options.dragClass);
                    $el.trigger('stop.oc.dragScroll');
                    self.options.stop();
                    self.fixScrollClasses()
                }
            }, 100)
        }

        /*
         * Scroll wheel has moved by supplied offset
         */
        function scrollWheel(offset) {
            startOffset = self.options.vertical ? el.scrollTop : el.scrollLeft;

            self.options.vertical
                ? $el.scrollTop(startOffset + offset)
                : $el.scrollLeft(startOffset + offset);

            var scrolled = self.options.vertical
                ? el.scrollTop != startOffset
                : el.scrollLeft != startOffset;

            $el.trigger('drag.oc.dragScroll');
            self.options.drag();

            if (scrolled) {
                if (self.wheelUpdateTimer !== undefined && self.wheelUpdateTimer !== false)
                    window.clearInterval(self.wheelUpdateTimer);

                self.wheelUpdateTimer = window.setTimeout(function () {
                    self.wheelUpdateTimer = false;
                    self.fixScrollClasses()
                }, 100);
            }

            return scrolled
        }

        this.fixScrollClasses();
    };

    DragScroll.prototype = Object.create(BaseProto);
    DragScroll.prototype.constructor = DragScroll;

    DragScroll.DEFAULTS = {
        vertical: false,
        useDrag: true,
        useScroll: true,
        useComboScroll: true,
        scrollClassContainer: false,
        scrollMarkerContainer: false,
        scrollSelector: null,
        dragSelector: null,
        dragClass: 'drag',
        start: function () {
        },
        drag: function () {
        },
        stop: function () {
        }
    };

    DragScroll.prototype.fixScrollClasses = function () {
        var isStart = this.isStart(),
            isEnd = this.isEnd();

        this.scrollClassContainer.toggleClass('scroll-before', !isStart);
        this.scrollClassContainer.toggleClass('scroll-after', !isEnd);

        this.scrollClassContainer.toggleClass('scroll-active-before', this.isActiveBefore());
        this.scrollClassContainer.toggleClass('scroll-active-after', this.isActiveAfter());
        this.isScrollable = !isStart || !isEnd
    };

    DragScroll.prototype.isStart = function () {
        if (!this.options.vertical) {
            return this.el.scrollLeft() <= 0;
        }
        else {
            return this.el.scrollTop() <= 0;
        }
    };

    DragScroll.prototype.isEnd = function () {
        if (!this.options.vertical) {
            return (this.el[0].scrollWidth - (this.el.scrollLeft() + this.el.width())) <= 0
        }
        else {
            return (this.el[0].scrollHeight - (this.el.scrollTop() + this.el.height())) <= 0
        }
    };

    DragScroll.prototype.goToStart = function () {
        if (!this.options.vertical) {
            return this.el.scrollLeft(0)
        }
        else {
            return this.el.scrollTop(0)
        }
    };

    /*
     * Determines if the element with the class 'active' is hidden before the viewport -
     * on the left or on the top, depending on whether the scrollbar is horizontal or vertical.
     */
    DragScroll.prototype.isActiveAfter = function () {
        var activeElement = $('.active', this.el);
        if (activeElement.length == 0) {
            return false
        }

        if (!this.options.vertical) {
            return activeElement.get(0).offsetLeft > (this.el.scrollLeft() + this.el.width())
        }
        else {
            return activeElement.get(0).offsetTop > (this.el.scrollTop() + this.el.height())
        }
    };

    /*
     * Determines if the element with the class 'active' is hidden after the viewport -
     * on the right or on the bottom, depending on whether the scrollbar is horizontal or vertical.
     */
    DragScroll.prototype.isActiveBefore = function () {
        var activeElement = $('.active', this.el);
        if (activeElement.length == 0) {
            return false
        }

        if (!this.options.vertical) {
            return (activeElement.get(0).offsetLeft + activeElement.width()) < this.el.scrollLeft()
        }
        else {
            return (activeElement.get(0).offsetTop + activeElement.height()) < this.el.scrollTop()
        }
    };

    DragScroll.prototype.goToElement = function (element, callback, options) {
        var $el = $(element);
        if (!$el.length)
            return;

        var self = this,
            params = {
                duration: 300,
                queue: false,
                complete: function () {
                    self.fixScrollClasses();
                    if (callback !== undefined)
                        callback()
                }
            };

        params = $.extend(params, options || {});

        var offset = 0,
            animated = false;

        if (!this.options.vertical) {
            offset = $el.get(0).offsetLeft - this.el.scrollLeft();

            if (offset < 0) {
                this.el.animate({'scrollLeft': $el.get(0).offsetLeft}, params);
                animated = true
            }
            else {
                offset = $el.get(0).offsetLeft + $el.width() - (this.el.scrollLeft() + this.el.width());
                if (offset > 0) {
                    this.el.animate({'scrollLeft': $el.get(0).offsetLeft + $el.width() - this.el.width()}, params);
                    animated = true
                }
            }
        }
        else {
            offset = $el.get(0).offsetTop - this.el.scrollTop();

            if (offset < 0) {
                this.el.animate({'scrollTop': $el.get(0).offsetTop}, params);
                animated = true
            }
            else {
                offset = $el.get(0).offsetTop - (this.el.scrollTop() + this.el.height());
                if (offset > 0) {
                    this.el.animate({'scrollTop': $el.get(0).offsetTop + $el.height() - this.el.height()}, params);
                    animated = true
                }
            }
        }

        if (!animated && callback !== undefined) {
            callback()
        }
    };

    DragScroll.prototype.dispose = function () {
        this.scrollClassContainer = null;

        $(document).off('ready', this.proxy(this.fixScrollClasses));
        $(window).off('resize', this.proxy(this.fixScrollClasses));
        this.el.off('.dragScroll');

        this.el.removeData('oc.dragScroll');

        this.el = null;
        BaseProto.dispose.call(this)
    };

    // DRAGSCROLL PLUGIN DEFINITION
    // ============================

    var old = $.fn.dragScroll;

    $.fn.dragScroll = function (option) {
        var args = arguments;

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.dragScroll');
            var options = typeof option == 'object' && option;

            if (!data) $this.data('oc.dragScroll', (data = new DragScroll(this, options)));
            if (typeof option == 'string') {
                var methodArgs = [];
                for (var i = 1; i < args.length; i++)
                    methodArgs.push(args[i])

                data[option].apply(data, methodArgs)
            }
        })
    };

    $.fn.dragScroll.Constructor = DragScroll;

    // DRAGSCROLL NO CONFLICT
    // =================

    $.fn.dragScroll.noConflict = function () {
        $.fn.dragScroll = old;
        return this
    }
}(window.jQuery);

/*
 * Tab control
 *
 * Documentation: ../docs/tab.md
 *
 * Require:
 *  - bootstrap/transition
 *  - bootstrap/tab
 *  - storm/toolbar
 */
+function ($) {
    "use strict";

    var Tab = function (element, options) {

        var $el = this.$el = $(element);
        this.options = options || {};
        this.$tabsContainer = $('.nav-tabs:first', $el);
        this.$pagesContainer = $('.tab-content:first', $el);
        this.tabId = 'tabs' + $el.parents().length + Math.round(Math.random() * 1000);

        if (this.options.closable !== undefined && this.options.closable !== false)
            $el.attr('data-closable', '');

        this.init()
    };

    Tab.prototype.init = function () {
        var self = this;

        this.options.slidable = this.options.slidable !== undefined && this.options.slidable !== false;

        $('> li', this.$tabsContainer).each(function (index) {
            self.initTab(this)
        });

        this.$el.on('close.oc.tab', function (ev, data) {
            ev.preventDefault();
            var force = (data !== undefined && data.force !== undefined) ? data.force : false;
            self.closeTab($(ev.target).closest('ul.nav-tabs > li, div.tab-content > div'), force)
        });

        this.$el.on('toggleCollapse.oc.tab', function (ev, data) {
            ev.preventDefault();
            $(ev.target).closest('div.tab-content > div').toggleClass('collapsed')
        });

        this.$el.on('modified.oc.tab', function (ev) {
            ev.preventDefault();
            self.modifyTab($(ev.target).closest('ul.nav-tabs > li, div.tab-content > div'))
        });

        this.$el.on('unmodified.oc.tab', function (ev) {
            ev.preventDefault();
            self.unmodifyTab($(ev.target).closest('ul.nav-tabs > li, div.tab-content > div'))
        });

        this.$tabsContainer.on('shown.bs.tab', 'li', function () {
            // self.$tabsContainer.dragScroll('fixScrollClasses')
            $(window).trigger('oc.updateUi');

            var tabUrl = $('> a', this).data('tabUrl');
            if (tabUrl) {
                window.history.replaceState({}, 'Tab link reference', tabUrl)
            }
        });

        if (this.options.slidable) {
            this.$pagesContainer.touchwipe({
                wipeRight: function () {
                    self.prev();
                },
                wipeLeft: function () {
                    self.next();
                },
                preventDefaultEvents: false,
                min_move_x: 60
            });
        }

        this.$tabsContainer.toolbar({
            scrollClassContainer: this.$el
        });

        this.updateClasses()
    };

    Tab.prototype.initTab = function (li) {
        var
            $tabs = $('>li', this.$tabsContainer),
            tabIndex = $tabs.index(li),
            time = new Date().getTime(),
            targetId = this.tabId + '-tab-' + tabIndex + time,
            $anchor = $('a', li);

        $anchor
            .data('target', '#' + targetId)
            .attr('data-target', '#' + targetId)
            .attr('data-toggle', 'tab');

        if (!$anchor.attr('title'))
            $anchor.attr('title', $anchor.text());

        var html = $anchor.html();

        $anchor.html('');
        $anchor
            .append($('<span class="title"></span>')
                .append($('<span></span>').html(html)));

        var pane = $('> .tab-pane', this.$pagesContainer).eq(tabIndex).attr('id', targetId);

        if (!$('span.tab-close', li).length) {
            $(li).append($('<span class="tab-close"><i>&times;</i></span>').click(function () {
                $(this).trigger('close.oc.tab');
                return false
            }))
        }

        pane.data('tab', li);

        this.$el.trigger('initTab.oc.tab', [{'pane': pane, 'tab': li}])
    };

    Tab.prototype.addTab = function (title, content, identifier, tabClass) {
        var
            processedTitle = this.generateTitleText(title, -1),
            $link = $('<a/>').attr('href', 'javascript:;').text(processedTitle),
            $li = $('<li/>'),
            $pane = $('<div>').html(content).addClass('tab-pane');

        $link.attr('title', title);
        $li.append($link);
        this.$tabsContainer.append($li);
        this.$pagesContainer.append($pane);

        if (tabClass !== undefined)
            $link.addClass(tabClass);

        if (identifier !== undefined)
            $li.attr('data-tab-id', identifier);

        if (this.options.paneClasses !== undefined)
            $pane.addClass(this.options.paneClasses);

        this.initTab($li);
        $link.tab('show');

        $(window).trigger('resize');
        this.$tabsContainer.dragScroll('goToElement', $li);

        var defaultFocus = $('[default-focus]', $pane);
        if (defaultFocus.is(":visible"))
            defaultFocus.focus();

        this.updateClasses()
    };

    Tab.prototype.updateTab = function (tab, title, content) {
        var tabIndex = this.findTabIndex(tab);
        if (tabIndex == -1)
            return;

        var
            processedTitle = this.generateTitleText(title, -1),
            $tab = $('> li', this.$tabsContainer).eq(tabIndex),
            $pane = $('> div', this.$pagesContainer).eq(tabIndex),
            $link = $('a', $tab);

        $link.text(processedTitle).attr('title', title);
        $pane.html(content);

        this.initTab($tab);

        this.updateClasses()
    };

    Tab.prototype.generateTitleText = function (title, tabIndex) {
        var newTitle = title;
        if (this.options.titleAsFileNames)
            newTitle = title.replace(/^.*[\\\/]/, '');

        if (this.options.maxTitleSymbols && newTitle.length > this.options.maxTitleSymbols)
            newTitle = '...' + newTitle.substring(newTitle.length - this.options.maxTitleSymbols);

        return newTitle
    };

    Tab.prototype.closeTab = function (tab, force) {
        var tabIndex = this.findTabIndex(tab);
        if (tabIndex == -1)
            return;

        var
            $tab = $('> li', this.$tabsContainer).eq(tabIndex),
            $pane = $('> div', this.$pagesContainer).eq(tabIndex),
            isActive = $tab.hasClass('active'),
            isModified = $tab.attr('data-modified') !== undefined;

        if (isModified && this.options.closeConfirmation !== undefined && force !== true) {
            if (!confirm(this.options.closeConfirmation))
                return
        }

        var e = $.Event('beforeClose.oc.tab', {relatedTarget: $pane});
        this.$el.trigger(e);
        if (e.isDefaultPrevented())
            return;

        Storm.foundation.controlUtils.disposeControls($pane.get(0));

        $pane.remove();
        $tab.remove();

        if (isActive)
            $('> li > a', this.$tabsContainer).eq(tabIndex - 1).tab('show');

        if ($('> li > a', this.$tabsContainer).length == 0)
            this.$el.trigger('afterAllClosed.oc.tab');

        this.$el.trigger('closed.oc.tab', [$tab, $pane]);

        $(window).trigger('resize');
        this.updateClasses()
    };

    Tab.prototype.updateClasses = function () {
        if (this.$tabsContainer.children().length > 0)
            this.$el.addClass('has-tabs');
        else
            this.$el.removeClass('has-tabs')
    };

    Tab.prototype.modifyTab = function (tab) {
        var tabIndex = this.findTabIndex(tab);
        if (tabIndex == -1)
            return;

        $('> li', this.$tabsContainer).eq(tabIndex).attr('data-modified', '');
        $('> div', this.$pagesContainer).eq(tabIndex).attr('data-modified', '')
    };

    Tab.prototype.unmodifyTab = function (tab) {
        var tabIndex = this.findTabIndex(tab);
        if (tabIndex == -1)
            return;

        $('> li', this.$tabsContainer).eq(tabIndex).removeAttr('data-modified');
        $('> div', this.$pagesContainer).eq(tabIndex).removeAttr('data-modified')
    };

    Tab.prototype.findTabIndex = function (tab) {
        var tabToFind = tab;

        if (tab === undefined)
            tabToFind = $('li.active', this.$tabsContainer);

        var tabParent = this.$pagesContainer;

        if ($(tabToFind).parent().hasClass('nav-tabs'))
            tabParent = this.$tabsContainer;

        return tabParent.children().index($(tabToFind))
    };

    Tab.prototype.findTabFromPane = function (pane) {
        var id = '#' + $(pane).attr('id'),
            tab = $('[data-target="' + id + '"]', this.$tabsContainer);

        return tab
    };

    Tab.prototype.findPaneFromTab = function (tab) {
        var id = $(tab).find('> a').data('target'),
            pane = this.$pagesContainer.find(id);

        return pane
    };

    Tab.prototype.goTo = function (identifier) {
        var $tab = $('[data-tab-id="' + identifier + '" ]', this.$tabsContainer);

        if ($tab.length == 0)
            return false;

        var tabIndex = this.findTabIndex($tab);
        if (tabIndex == -1)
            return false;

        this.goToIndex(tabIndex);

        this.$tabsContainer.dragScroll('goToElement', $tab);

        return true
    };

    Tab.prototype.goToPane = function (pane) {
        var $pane = $(pane),
            $tab = this.findTabFromPane($pane);

        if ($pane.length == 0)
            return;

        $pane.removeClass('collapsed');

        var tabIndex = this.findTabIndex($pane);
        if (tabIndex == -1)
            return false;

        this.goToIndex(tabIndex);

        if ($tab.length > 0)
            this.$tabsContainer.dragScroll('goToElement', $tab);

        return true
    };

    Tab.prototype.goToElement = function (element) {
        return this.goToPane(element.closest('.tab-pane'))
    };

    Tab.prototype.findByIdentifier = function (identifier) {
        return $('[data-tab-id="' + identifier + '" ]', this.$tabsContainer);
    };

    Tab.prototype.updateIdentifier = function (tab, identifier) {
        var index = this.findTabIndex(tab);
        if (index == -1)
            return;

        $('> li', this.$tabsContainer).eq(index).attr('data-tab-id', identifier)
    };

    Tab.prototype.updateTitle = function (tab, title) {
        var index = this.findTabIndex(tab);
        if (index == -1)
            return;

        var processedTitle = this.generateTitleText(title, index),
            $link = $('> li > a span.title', this.$tabsContainer).eq(index);

        $link.attr('title', title);
        $link.text(processedTitle)
    };

    Tab.prototype.goToIndex = function (index) {
        $('> li > a', this.$tabsContainer).eq(index).tab('show')
    };

    Tab.prototype.prev = function () {
        var tabIndex = this.findTabIndex();
        if (tabIndex <= 0)
            return;

        this.goToIndex(tabIndex - 1)
    };

    Tab.prototype.next = function () {
        var tabIndex = this.findTabIndex();
        if (tabIndex == -1)
            return;

        this.goToIndex(tabIndex + 1)
    };

    Tab.DEFAULTS = {};

    // TAB PLUGIN DEFINITION
    // ============================

    var old = $.fn.ocTab;

    $.fn.ocTab = function (option) {
        var args = arguments;

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('oc.tab');
            var options = $.extend({}, Tab.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('oc.tab', (data = new Tab(this, options)));
            if (typeof option == 'string') {
                var methodArgs = [];
                for (var i = 1; i < args.length; i++)
                    methodArgs.push(args[i])

                data[option].apply(data, methodArgs)
            }
        })
    };

    $.fn.ocTab.Constructor = Tab;

    // TAB NO CONFLICT
    // =================

    $.fn.ocTab.noConflict = function () {
        $.fn.ocTab = old;
        return this
    };

    // TAB DATA-API
    // ============
    $(document).on('render', function () {
        $('[data-control=tab]').ocTab()
    });

    /*
     * Detect invalid fields, focus the tab
     */
    $(window).on('ajaxInvalidField', function (event, element, name, messages, isFirst) {
        if (!isFirst) return;

        event.preventDefault();

        var $el = $(element);
        $el.closest('[data-control=tab]').ocTab('goToElement', $el);
        $el.focus()
    })

}(window.jQuery);
/*
 * Inspector Surface class.
 *
 * The class creates Inspector user interface and all the editors
 * corresponding to the passed configuration in a specified container
 * element.
 *
 */
+function ($) {
    "use strict";

    // NAMESPACES
    // ============================

    if (window.Storm === undefined) {
        window.Storm = {};
    }

    if (Storm.inspector === undefined)
        Storm.inspector = {};

    // CLASS DEFINITION
    // ============================

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    /**
     * Creates the Inspector surface in a container.
     * - containerElement container DOM element
     * - properties array (array of objects)
     * - values - property values, an object
     * - inspectorUniqueId - a string containing the unique inspector identifier.
     *   The identifier should be a constant for an inspectable element. Use
     *   Storm.inspector.helpers.generateElementUniqueId(element) to generate a persistent ID
     *   for an element. Use Storm.inspector.helpers.generateUniqueId() to generate an ID
     *   not associated with an element. Inspector uses the ID for storing configuration
     *   related to an element in the document DOM.
     */
    var Surface = function (containerElement, properties, values, inspectorUniqueId, options, parentSurface, group, propertyName) {
        if (inspectorUniqueId === undefined) {
            throw new Error('Inspector surface unique ID should be defined.')
        }

        this.options = $.extend({}, Surface.DEFAULTS, typeof options == 'object' && options);
        this.rawProperties = properties;
        this.parsedProperties = Storm.inspector.engine.processPropertyGroups(properties);
        this.container = containerElement;
        this.inspectorUniqueId = inspectorUniqueId;
        this.values = values !== null ? values : {};
        this.originalValues = $.extend(true, {}, this.values); // Clone the values hash
        this.idCounter = 1;
        this.popupCounter = 0;
        this.parentSurface = parentSurface;
        this.propertyName = propertyName;

        this.editors = [];
        this.externalParameterEditors = [];
        this.tableContainer = null;
        this.groupManager = null;
        this.group = null;

        if (group !== undefined) {
            this.group = group
        }

        if (!this.parentSurface) {
            this.groupManager = new Storm.inspector.groupManager(this.inspectorUniqueId)
        }

        Base.call(this);

        this.init()
    };

    Surface.prototype = Object.create(BaseProto);
    Surface.prototype.constructor = Surface;

    Surface.prototype.dispose = function () {
        this.unregisterHandlers();
        this.disposeControls();
        this.disposeEditors();
        this.removeElements();
        this.disposeExternalParameterEditors();

        this.container = null;
        this.tableContainer = null;
        this.rawProperties = null;
        this.parsedProperties = null;
        this.editors = null;
        this.externalParameterEditors = null;
        this.values = null;
        this.originalValues = null;
        this.options.onChange = null;
        this.options.onPopupDisplayed = null;
        this.options.onPopupHidden = null;
        this.options.onGetInspectableElement = null;
        this.parentSurface = null;
        this.groupManager = null;
        this.group = null;

        BaseProto.dispose.call(this)
    };

    // INTERNAL METHODS
    // ============================

    Surface.prototype.init = function () {
        if (this.groupManager && !this.group) {
            this.group = this.groupManager.createGroup('root')
        }

        this.build();

        if (!this.parentSurface) {
            Storm.foundation.controlUtils.markDisposable(this.tableContainer)
        }

        this.registerHandlers()
    };

    Surface.prototype.registerHandlers = function () {
        if (!this.parentSurface) {
            $(this.tableContainer).one('dispose-control', this.proxy(this.dispose));
            $(this.tableContainer).on('click', 'tr.group, tr.control-group', this.proxy(this.onGroupClick));
            $(this.tableContainer).on('focus-control', this.proxy(this.focusFirstEditor))
        }
    };

    Surface.prototype.unregisterHandlers = function () {
        if (!this.parentSurface) {
            $(this.tableContainer).off('dispose-control', this.proxy(this.dispose));
            $(this.tableContainer).off('click', 'tr.group, tr.control-group', this.proxy(this.onGroupClick));
            $(this.tableContainer).off('focus-control', this.proxy(this.focusFirstEditor))
        }
    };

    //
    // Building
    //

    /**
     * Builds the Inspector table. The markup generated by this method looks
     * like this:
     *
     * <div>
     *     <table>
     *         <tbody>
     *             <tr>
     *                 <th data-property="label">
     *                     <div>
     *                         <div>
     *                             <span class="title-element" title="Label">
     *                                 <a href="javascript:;" class="expandControl expanded" data-group-index="1">Expand/Collapse</a>
     *                                 Label
     *                             </span>
     *                         </div>
     *                     </div>
     *                 </th>
     *                 <td>
     *                     Editor markup
     *                 </td>
     *             </tr>
     *         </tbody>
     *     </table>
     * </div>
     */
    Surface.prototype.build = function () {
        this.tableContainer = document.createElement('div');

        var dataTable = document.createElement('table'),
            tbody = document.createElement('tbody');

        Storm.foundation.element.addClass(dataTable, 'inspector-fields');
        if (this.parsedProperties.hasGroups) {
            Storm.foundation.element.addClass(dataTable, 'has-groups')
        }

        var currentGroup = this.group;

        for (var i = 0, len = this.parsedProperties.properties.length; i < len; i++) {
            var property = this.parsedProperties.properties[i];

            if (property.itemType == 'group') {
                currentGroup = this.getGroupManager().createGroup(property.groupIndex, this.group)
            }
            else {
                if (property.groupIndex === undefined) {
                    currentGroup = this.group
                }
            }

            var row = this.buildRow(property, currentGroup);

            if (property.itemType == 'group') {
                this.applyGroupLevelToRow(row, currentGroup.parentGroup)
            }
            else {
                this.applyGroupLevelToRow(row, currentGroup)
            }

            tbody.appendChild(row);

            // Editor
            //
            this.buildEditor(row, property, dataTable, currentGroup)
        }

        dataTable.appendChild(tbody);
        this.tableContainer.appendChild(dataTable);

        this.container.appendChild(this.tableContainer);

        if (this.options.enableExternalParameterEditor) {
            this.buildExternalParameterEditor(tbody)
        }

        if (!this.parentSurface) {
            this.focusFirstEditor()
        }
    };

    Surface.prototype.moveToContainer = function (newContainer) {
        this.container = newContainer;

        this.container.appendChild(this.tableContainer)
    };

    Surface.prototype.buildRow = function (property, group) {
        var row = document.createElement('tr'),
            th = document.createElement('th'),
            titleSpan = document.createElement('span'),
            description = this.buildPropertyDescription(property);

        // Table row
        //
        if (property.property) {
            row.setAttribute('data-property', property.property);
            row.setAttribute('data-property-path', this.getPropertyPath(property.property))
        }

        this.applyGroupIndexAttribute(property, row, group);
        Storm.foundation.element.addClass(row, this.getRowCssClass(property, group));

        // Property head
        //
        this.applyHeadColspan(th, property);

        titleSpan.setAttribute('class', 'title-element');
        titleSpan.setAttribute('title', this.escapeJavascriptString(property.title));
        this.buildGroupExpandControl(titleSpan, property, false, false, group);

        titleSpan.innerHTML += this.escapeJavascriptString(property.title);

        var outerDiv = document.createElement('div'),
            innerDiv = document.createElement('div');

        innerDiv.appendChild(titleSpan);

        if (description) {
            innerDiv.appendChild(description)
        }

        outerDiv.appendChild(innerDiv);
        th.appendChild(outerDiv);
        row.appendChild(th);

        return row
    };

    Surface.prototype.focusFirstEditor = function () {
        if (this.editors.length == 0) {
            return
        }

        var groupManager = this.getGroupManager();

        for (var i = 0, len = this.editors.length; i < len; i++) {
            var editor = this.editors[i],
                group = editor.parentGroup;

            if (group && !this.groupManager.isGroupExpanded(group)) {
                continue
            }

            var externalParameterEditor = this.findExternalParameterEditor(editor.getPropertyName());

            if (externalParameterEditor && externalParameterEditor.isEditorVisible()) {
                externalParameterEditor.focus();
                return
            }

            editor.focus();
            return
        }
    };

    Surface.prototype.getRowCssClass = function (property, group) {
        var result = property.itemType;

        if (property.itemType == 'property') {
            // result += ' grouped'
            if (group.parentGroup) {
                result += this.getGroupManager().isGroupExpanded(group) ? ' expanded' : ' collapsed'
            }
        }

        if (property.itemType == 'property' && !property.showExternalParam) {
            result += ' no-external-parameter'
        }

        return result
    };

    Surface.prototype.applyHeadColspan = function (th, property) {
        if (property.itemType == 'group') {
            th.setAttribute('colspan', 2)
        }
    };

    Surface.prototype.buildGroupExpandControl = function (titleSpan, property, force, hasChildSurface, group) {
        if (property.itemType !== 'group' && !force) {
            return
        }

        var groupIndex = this.getGroupManager().getGroupIndex(group),
            statusClass = this.getGroupManager().isGroupExpanded(group) ? 'expanded' : '',
            anchor = document.createElement('a');

        anchor.setAttribute('class', 'expandControl ' + statusClass);
        anchor.setAttribute('href', 'javascript:;');
        anchor.innerHTML = '<span>Expand/collapse</span>';

        titleSpan.appendChild(anchor)
    };

    Surface.prototype.buildPropertyDescription = function (property) {
        if (property.description === undefined || property.description === null) {
            return null
        }

        var span = document.createElement('span');
        span.setAttribute('title', this.escapeJavascriptString(property.description));
        span.setAttribute('class', 'info oc-icon-info with-tooltip');

        $(span).tooltip({placement: 'auto right', container: 'body', delay: 500});

        return span
    };

    Surface.prototype.buildExternalParameterEditor = function (tbody) {
        var rows = tbody.children;

        for (var i = 0, len = rows.length; i < len; i++) {
            var row = rows[i],
                property = row.getAttribute('data-property');

            if (Storm.foundation.element.hasClass(row, 'no-external-parameter') || !property) {
                continue
            }

            var propertyEditor = this.findPropertyEditor(property);
            if (propertyEditor && !propertyEditor.supportsExternalParameterEditor()) {
                continue
            }

            var cell = row.querySelector('td'),
                propertyDefinition = this.findPropertyDefinition(property),
                initialValue = this.getPropertyValue(property);

            if (initialValue === undefined) {
                initialValue = propertyEditor.getUndefinedValue()
            }

            var editor = new Storm.inspector.externalParameterEditor(this, propertyDefinition, cell, initialValue);

            this.externalParameterEditors.push(editor)
        }
    };

    //
    // Field grouping
    //

    Surface.prototype.applyGroupIndexAttribute = function (property, row, group, isGroupedControl) {
        if (property.itemType == 'group' || isGroupedControl) {
            row.setAttribute('data-group-index', this.getGroupManager().getGroupIndex(group));
            row.setAttribute('data-parent-group-index', this.getGroupManager().getGroupIndex(group.parentGroup))
        }
        else {
            if (group.parentGroup) {
                row.setAttribute('data-parent-group-index', this.getGroupManager().getGroupIndex(group))
            }
        }
    };

    Surface.prototype.applyGroupLevelToRow = function (row, group) {
        if (row.hasAttribute('data-group-level')) {
            return
        }

        var th = this.getRowHeadElement(row);

        if (th === null) {
            throw new Error('Cannot find TH element for the Inspector row')
        }

        var groupLevel = group.getLevel();

        row.setAttribute('data-group-level', groupLevel);
        th.children[0].style.marginLeft = groupLevel * 10 + 'px'
    };

    Surface.prototype.toggleGroup = function (row, forceExpand) {
        var link = row.querySelector('a'),
            groupIndex = row.getAttribute('data-group-index'),
            table = this.getRootTable(),
            groupManager = this.getGroupManager(),
            collapse = true;

        if (Storm.foundation.element.hasClass(link, 'expanded') && !forceExpand) {
            Storm.foundation.element.removeClass(link, 'expanded')
        }
        else {
            Storm.foundation.element.addClass(link, 'expanded');
            collapse = false
        }

        var propertyRows = groupManager.findGroupRows(table, groupIndex, !collapse),
            duration = Math.round(50 / propertyRows.length);

        this.expandOrCollapseRows(propertyRows, collapse, duration, forceExpand);
        groupManager.setGroupStatus(groupIndex, !collapse)
    };

    Surface.prototype.expandGroupParents = function (group) {
        var groups = group.getGroupAndAllParents(),
            table = this.getRootTable();

        for (var i = groups.length - 1; i >= 0; i--) {
            var row = groups[i].findGroupRow(table);

            if (row) {
                this.toggleGroup(row, true)
            }
        }
    };

    Surface.prototype.expandOrCollapseRows = function (rows, collapse, duration, noAnimation) {
        var row = rows.pop(),
            self = this;

        if (row) {
            if (!noAnimation) {
                setTimeout(function toggleRow() {
                    Storm.foundation.element.toggleClass(row, 'collapsed', collapse);
                    Storm.foundation.element.toggleClass(row, 'expanded', !collapse);

                    self.expandOrCollapseRows(rows, collapse, duration, noAnimation)
                }, duration)
            }
            else {
                Storm.foundation.element.toggleClass(row, 'collapsed', collapse);
                Storm.foundation.element.toggleClass(row, 'expanded', !collapse);

                self.expandOrCollapseRows(rows, collapse, duration, noAnimation)
            }
        }
    };

    Surface.prototype.getGroupManager = function () {
        return this.getRootSurface().groupManager
    };

    //
    // Editors
    //

    Surface.prototype.buildEditor = function (row, property, dataTable, group) {
        if (property.itemType !== 'property') {
            return
        }

        this.validateEditorType(property.type);

        var cell = document.createElement('td'),
            type = property.type;

        row.appendChild(cell);

        if (type === undefined) {
            type = 'string'
        }

        var editor = new Storm.inspector.propertyEditors[type](this, property, cell, group);

        if (editor.isGroupedEditor()) {
            Storm.foundation.element.addClass(dataTable, 'has-groups');
            Storm.foundation.element.addClass(row, 'control-group');

            this.applyGroupIndexAttribute(property, row, editor.group, true);
            this.buildGroupExpandControl(row.querySelector('span.title-element'), property, true, editor.hasChildSurface(), editor.group);

            if (cell.children.length == 0) {
                // If the editor hasn't added any elements to the cell,
                // and it's a grouped control, remove the cell and
                // make the group title full-width.
                row.querySelector('th').setAttribute('colspan', 2);
                row.removeChild(cell)
            }
        }

        this.editors.push(editor)
    };

    Surface.prototype.generateSequencedId = function () {
        this.idCounter++;

        return this.inspectorUniqueId + '-' + this.idCounter
    };

    //
    // Internal API for the editors
    //

    Surface.prototype.getPropertyValue = function (property) {
        return this.values[property]
    };

    Surface.prototype.setPropertyValue = function (property, value, supressChangeEvents, forceEditorUpdate) {
        if (value !== undefined) {
            this.values[property] = value
        }
        else {
            if (this.values[property] !== undefined) {
                delete this.values[property]
            }
        }

        if (!supressChangeEvents) {
            if (this.originalValues[property] === undefined || !this.comparePropertyValues(this.originalValues[property], value)) {
                this.markPropertyChanged(property, true)
            }
            else {
                this.markPropertyChanged(property, false)
            }

            var propertyPath = this.getPropertyPath(property);
            this.getRootSurface().notifyEditorsPropertyChanged(propertyPath, value);

            if (this.options.onChange !== null) {
                this.options.onChange(property, value)
            }
        }

        if (forceEditorUpdate) {
            var editor = this.findPropertyEditor(property);
            if (editor) {
                editor.updateDisplayedValue(value)
            }
        }

        return value
    };

    Surface.prototype.notifyEditorsPropertyChanged = function (propertyPath, value) {
        // Editors use this event to watch changes in properties
        // they depend on. All editors should be notified, including 
        // editors in nested surfaces. The property name is passed as a
        // path object.property (if the property is nested), so that 
        // property depenencies could be defined as 
        // ['property', 'object.property']

        for (var i = 0, len = this.editors.length; i < len; i++) {
            var editor = this.editors[i];

            editor.onInspectorPropertyChanged(propertyPath, value);
            editor.notifyChildSurfacesPropertyChanged(propertyPath, value)
        }
    };

    Surface.prototype.makeCellActive = function (cell) {
        var tbody = cell.parentNode.parentNode.parentNode, // cell / row / tbody
            cells = tbody.querySelectorAll('tr td');

        for (var i = 0, len = cells.length; i < len; i++) {
            Storm.foundation.element.removeClass(cells[i], 'active')
        }

        Storm.foundation.element.addClass(cell, 'active')
    };

    Surface.prototype.markPropertyChanged = function (property, changed) {
        var propertyPath = this.getPropertyPath(property),
            row = this.tableContainer.querySelector('tr[data-property-path="' + propertyPath + '"]');

        if (changed) {
            Storm.foundation.element.addClass(row, 'changed')
        }
        else {
            Storm.foundation.element.removeClass(row, 'changed')
        }
    };

    Surface.prototype.findPropertyEditor = function (property) {
        for (var i = 0, len = this.editors.length; i < len; i++) {
            if (this.editors[i].getPropertyName() == property) {
                return this.editors[i]
            }
        }

        return null
    };

    Surface.prototype.findExternalParameterEditor = function (property) {
        for (var i = 0, len = this.externalParameterEditors.length; i < len; i++) {
            if (this.externalParameterEditors[i].getPropertyName() == property) {
                return this.externalParameterEditors[i]
            }
        }

        return null
    };

    Surface.prototype.findPropertyDefinition = function (property) {
        for (var i = 0, len = this.parsedProperties.properties.length; i < len; i++) {
            var definition = this.parsedProperties.properties[i];

            if (definition.property == property) {
                return definition
            }
        }

        return null
    };

    Surface.prototype.validateEditorType = function (type) {
        if (type === undefined) {
            type = 'string'
        }

        if (Storm.inspector.propertyEditors[type] === undefined) {
            throw new Error('The Inspector editor class "' + type +
                '" is not defined in the Storm.inspector.propertyEditors namespace.')
        }
    };

    Surface.prototype.popupDisplayed = function () {
        if (this.popupCounter === 0 && this.options.onPopupDisplayed !== null) {
            this.options.onPopupDisplayed()
        }

        this.popupCounter++
    };

    Surface.prototype.popupHidden = function () {
        this.popupCounter--;

        if (this.popupCounter < 0) {
            this.popupCounter = 0
        }

        if (this.popupCounter === 0 && this.options.onPopupHidden !== null) {
            this.options.onPopupHidden()
        }
    };

    Surface.prototype.getInspectableElement = function () {
        if (this.options.onGetInspectableElement !== null) {
            return this.options.onGetInspectableElement()
        }
    };

    Surface.prototype.getPropertyPath = function (propertyName) {
        var result = [],
            current = this;

        result.push(propertyName);

        while (current) {
            if (current.propertyName) {
                result.push(current.propertyName)
            }

            current = current.parentSurface
        }

        result.reverse();

        return result.join('.')
    };

    //
    // Nested surfaces support
    //

    Surface.prototype.mergeChildSurface = function (surface, mergeAfterRow) {
        var rows = surface.tableContainer.querySelectorAll('table.inspector-fields > tbody > tr');

        surface.tableContainer = this.getRootSurface().tableContainer;

        for (var i = rows.length - 1; i >= 0; i--) {
            var row = rows[i];

            mergeAfterRow.parentNode.insertBefore(row, mergeAfterRow.nextSibling);
            this.applyGroupLevelToRow(row, surface.group)
        }
    };

    Surface.prototype.getRowHeadElement = function (row) {
        for (var i = row.children.length - 1; i >= 0; i--) {
            var element = row.children[i];

            if (element.tagName === 'TH') {
                return element
            }
        }

        return null
    };

    Surface.prototype.getInspectorUniqueId = function () {
        return this.inspectorUniqueId
    };

    Surface.prototype.getRootSurface = function () {
        var current = this;

        while (current) {
            if (!current.parentSurface) {
                return current
            }

            current = current.parentSurface
        }
    };

    //
    // Disposing
    //

    Surface.prototype.removeElements = function () {
        if (!this.parentSurface) {
            this.tableContainer.parentNode.removeChild(this.tableContainer);
        }
    };

    Surface.prototype.disposeEditors = function () {
        for (var i = 0, len = this.editors.length; i < len; i++) {
            var editor = this.editors[i];

            editor.dispose()
        }
    };

    Surface.prototype.disposeExternalParameterEditors = function () {
        for (var i = 0, len = this.externalParameterEditors.length; i < len; i++) {
            var editor = this.externalParameterEditors[i];

            editor.dispose()
        }
    };

    Surface.prototype.disposeControls = function () {
        var tooltipControls = this.tableContainer.querySelectorAll('.with-tooltip');

        for (var i = 0, len = tooltipControls.length; i < len; i++) {
            $(tooltipControls[i]).tooltip('destroy')
        }
    };

    //
    // Helpers
    //

    Surface.prototype.escapeJavascriptString = function (str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML
    };

    Surface.prototype.comparePropertyValues = function (oldValue, newValue) {
        if (oldValue === undefined && newValue !== undefined) {
            return false
        }

        if (oldValue !== undefined && newValue === undefined) {
            return false
        }

        if (typeof oldValue == 'object' && typeof newValue == 'object') {
            return JSON.stringify(oldValue) == JSON.stringify(newValue)
        }

        return oldValue == newValue
    };

    Surface.prototype.getRootTable = function () {
        return this.getRootSurface().container.querySelector('table.inspector-fields')
    };

    //
    // External API
    //

    Surface.prototype.getValues = function () {
        var result = {};

        for (var i = 0, len = this.parsedProperties.properties.length; i < len; i++) {
            var property = this.parsedProperties.properties[i];

            if (property.itemType !== 'property') {
                continue
            }

            var value = null,
                externalParameterEditor = this.findExternalParameterEditor(property.property);

            if (!externalParameterEditor || !externalParameterEditor.isEditorVisible()) {
                value = this.getPropertyValue(property.property);

                var editor = this.findPropertyEditor(property.property);

                if (value === undefined) {
                    if (editor) {
                        value = editor.getUndefinedValue()
                    }
                    else {
                        value = property.default
                    }
                }

                if (value === Storm.inspector.removedProperty) {
                    continue
                }

                if (property.ignoreIfEmpty !== undefined && (property.ignoreIfEmpty === true || property.ignoreIfEmpty === "true") && editor) {
                    if (editor.isEmptyValue(value)) {
                        continue
                    }
                }

                if (property.ignoreIfDefault !== undefined && (property.ignoreIfDefault === true || property.ignoreIfDefault === "true") && editor) {
                    if (property.default === undefined) {
                        throw new Error('The ignoreIfDefault feature cannot be used without the default property value.')
                    }

                    if (this.comparePropertyValues(value, property.default)) {
                        continue
                    }
                }
            }
            else {
                value = externalParameterEditor.getValue();
                value = '{{ ' + value + ' }}'
            }

            result[property.property] = value
        }

        return result
    };

    Surface.prototype.getValidValues = function () {
        var allValues = this.getValues(),
            result = {};

        for (var property in allValues) {
            var editor = this.findPropertyEditor(property);

            if (!editor) {
                throw new Error('Cannot find editor for property ' + property)
            }

            var externalEditor = this.findExternalParameterEditor(property);
            if (externalEditor && externalEditor.isEditorVisible() && !externalEditor.validate(true)) {
                result[property] = Storm.inspector.invalidProperty;
                continue
            }

            if (!editor.validate(true)) {
                result[property] = Storm.inspector.invalidProperty;
                continue
            }

            result[property] = allValues[property]
        }

        return result
    };

    Surface.prototype.validate = function (silentMode) {
        this.getGroupManager().unmarkInvalidGroups(this.getRootTable());

        for (var i = 0, len = this.editors.length; i < len; i++) {
            var editor = this.editors[i],
                externalEditor = this.findExternalParameterEditor(editor.propertyDefinition.property);

            if (externalEditor && externalEditor.isEditorVisible()) {
                if (!externalEditor.validate(silentMode)) {
                    if (!silentMode) {
                        editor.markInvalid()
                    }
                    return false
                }
                else {
                    continue
                }
            }

            if (!editor.validate(silentMode)) {
                if (!silentMode) {
                    editor.markInvalid()
                }
                return false
            }
        }

        return true
    };

    Surface.prototype.hasChanges = function (originalValues) {
        var values = originalValues !== undefined ? originalValues : this.originalValues;

        return !this.comparePropertyValues(values, this.getValues())
    };

    // EVENT HANDLERS
    //

    Surface.prototype.onGroupClick = function (ev) {
        var row = ev.currentTarget;

        this.toggleGroup(row);

        Storm.foundation.event.stop(ev);
        return false
    };

    // DEFAULT OPTIONS
    // ============================

    Surface.DEFAULTS = {
        enableExternalParameterEditor: false,
        onChange: null,
        onPopupDisplayed: null,
        onPopupHidden: null,
        onGetInspectableElement: null
    };

    // REGISTRATION
    // ============================

    Storm.inspector.surface = Surface;
    Storm.inspector.removedProperty = {removed: true};
    Storm.inspector.invalidProperty = {invalid: true}
}(window.jQuery);
/*
 * Inspector management functions.
 *
 * Watches inspectable elements clicks and creates Inspector surfaces in popups
 * and containers.
 */
+function ($) {
    "use strict";

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var InspectorManager = function () {
        Base.call(this);

        this.init()
    };

    InspectorManager.prototype = Object.create(BaseProto);
    InspectorManager.prototype.constructor = Base;

    InspectorManager.prototype.init = function () {
        $(document).on('click', '[data-inspectable]', this.proxy(this.onInspectableClicked))
    };

    InspectorManager.prototype.getContainerElement = function ($element) {
        var $containerHolder = $element.closest('[data-inspector-container]');
        if ($containerHolder.length === 0) {
            return null
        }

        var $container = $containerHolder.find($containerHolder.data('inspector-container'));
        if ($container.length === 0) {
            throw new Error('Inspector container ' + $containerHolder.data['inspector-container'] + ' element is not found.')
        }

        return $container
    };

    InspectorManager.prototype.loadElementOptions = function ($element) {
        var options = {};

        // Only specific options are allowed, don't load all options with data()
        //
        if ($element.data('inspector-css-class')) {
            options.inspectorCssClass = $element.data('inspector-css-class')
        }

        return options
    };

    InspectorManager.prototype.createInspectorPopup = function ($element, containerSupported) {
        var options = $.extend(this.loadElementOptions($element), {
            containerSupported: containerSupported
        });

        new Storm.inspector.wrappers.popup($element, null, options)
    };

    InspectorManager.prototype.createInspectorContainer = function ($element, $container) {
        var options = $.extend(this.loadElementOptions($element), {
            containerSupported: true,
            container: $container
        });

        new Storm.inspector.wrappers.container($element, null, options)
    };

    InspectorManager.prototype.switchToPopup = function (wrapper) {
        var options = $.extend(this.loadElementOptions(wrapper.$element), {
            containerSupported: true
        });

        new Storm.inspector.wrappers.popup(wrapper.$element, wrapper, options);

        wrapper.cleanupAfterSwitch();
        this.setContainerPreference(false)
    };

    InspectorManager.prototype.switchToContainer = function (wrapper) {
        var $container = this.getContainerElement(wrapper.$element),
            options = $.extend(this.loadElementOptions(wrapper.$element), {
                containerSupported: true,
                container: $container
            });

        if (!$container) {
            throw new Error('Cannot switch to container: a container element is not found')
        }

        new Storm.inspector.wrappers.container(wrapper.$element, wrapper, options);

        wrapper.cleanupAfterSwitch();
        this.setContainerPreference(true)
    };

    InspectorManager.prototype.createInspector = function (element) {
        var $element = $(element);

        if ($element.data('oc.inspectorVisible')) {
            return false
        }

        var $container = this.getContainerElement($element);

        // If there's no container option, create the Inspector popup
        //
        if (!$container) {
            this.createInspectorPopup($element, false)
        }
        else {
            // If the container is already in use, apply values to the inspectable elements
            if (!this.applyValuesFromContainer($container) || !this.containerHidingAllowed($container)) {
                return
            }

            // Dispose existing container wrapper, if any
            Storm.foundation.controlUtils.disposeControls($container.get(0));

            if (!this.getContainerPreference()) {
                // If container is not a preferred option, create Inspector popoup
                this.createInspectorPopup($element, true)
            }
            else {
                // Otherwise, create Inspector in the container
                this.createInspectorContainer($element, $container)
            }
        }
    };

    InspectorManager.prototype.getContainerPreference = function () {
        if (!Modernizr.localstorage) {
            return false
        }

        return localStorage.getItem('oc.inspectorUseContainer') === "true"
    };

    InspectorManager.prototype.setContainerPreference = function (value) {
        if (!Modernizr.localstorage) {
            return
        }

        return localStorage.setItem('oc.inspectorUseContainer', value ? "true" : "false")
    };

    InspectorManager.prototype.applyValuesFromContainer = function ($container) {
        var applyEvent = $.Event('apply.oc.inspector');

        $container.trigger(applyEvent);
        return !applyEvent.isDefaultPrevented();
    };

    InspectorManager.prototype.containerHidingAllowed = function ($container) {
        var allowedEvent = $.Event('beforeContainerHide.oc.inspector');

        $container.trigger(allowedEvent);
        return !allowedEvent.isDefaultPrevented();
    };

    InspectorManager.prototype.onInspectableClicked = function (ev) {
        var $element = $(ev.currentTarget);

        if (this.createInspector($element) === false) {
            return false
        }

        ev.stopPropagation();
        return false
    };

    Storm.inspector.manager = new InspectorManager();

    $.fn.inspector = function () {
        return this.each(function () {
            Storm.inspector.manager.createInspector(this)
        })
    }
}(window.jQuery);
/*
 * Inspector wrapper base class.
 */
+function ($) {
    "use strict";

    // NAMESPACES
    // ============================

    if (Storm.inspector === undefined)
        Storm.inspector = {};

    if (Storm.inspector.wrappers === undefined)
        Storm.inspector.wrappers = {};

    // CLASS DEFINITION
    // ============================

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var BaseWrapper = function ($element, sourceWrapper, options) {
        this.$element = $element;

        this.options = $.extend({}, BaseWrapper.DEFAULTS, typeof options == 'object' && options);
        this.switched = false;
        this.configuration = null;

        Base.call(this);

        if (!sourceWrapper) {
            if (!this.triggerShowingAndInit()) {
                // this.init() is called inside triggerShowing()

                return
            }

            this.surface = null;
            this.title = null;
            this.description = null
        }
        else {
            this.surface = sourceWrapper.surface;
            this.title = sourceWrapper.title;
            this.description = sourceWrapper.description;

            sourceWrapper = null;

            this.init()
        }
    };

    BaseWrapper.prototype = Object.create(BaseProto);
    BaseWrapper.prototype.constructor = Base;

    BaseWrapper.prototype.dispose = function () {
        if (!this.switched) {
            this.$element.removeClass('inspector-open');
            this.setInspectorVisibleFlag(false);

            this.$element.trigger('hidden.oc.inspector')
        }

        if (this.surface !== null && this.surface.options.onGetInspectableElement === this.proxy(this.onGetInspectableElement)) {
            this.surface.options.onGetInspectableElement = null
        }

        this.surface = null;
        this.$element = null;
        this.title = null;
        this.description = null;
        this.configuration = null;

        BaseProto.dispose.call(this)
    };

    BaseWrapper.prototype.init = function () {
        // Wrappers can create a new surface or inject an existing
        // surface to the UI they manage.
        //
        // If there is no surface provided in the wrapper constructor,
        // the wrapper first loads the Inspector configuration and values
        // and then calls the createSurfaceAndUi() method with all information
        // required for creating a new Inspector surface and UI.

        if (!this.surface) {
            this.loadConfiguration()
        }
        else {
            this.adoptSurface()
        }

        this.$element.addClass('inspector-open')
    };

    //
    // Helper methods
    //

    BaseWrapper.prototype.getElementValuesInput = function () {
        return this.$element.find('> input[data-inspector-values]')
    };

    BaseWrapper.prototype.normalizePropertyCode = function (code, configuration) {
        var lowerCaseCode = code.toLowerCase();

        for (var index in configuration) {
            var propertyInfo = configuration[index];

            if (propertyInfo.property.toLowerCase() == lowerCaseCode) {
                return propertyInfo.property
            }
        }

        return code
    };

    BaseWrapper.prototype.isExternalParametersEditorEnabled = function () {
        return this.$element.closest('[data-inspector-external-parameters]').length > 0
    };

    BaseWrapper.prototype.initSurface = function (containerElement, properties, values) {
        var options = this.$element.data() || {};

        options.enableExternalParameterEditor = this.isExternalParametersEditorEnabled();
        options.onGetInspectableElement = this.proxy(this.onGetInspectableElement);

        this.surface = new Storm.inspector.surface(
            containerElement,
            properties,
            values,
            Storm.inspector.helpers.generateElementUniqueId(this.$element.get(0)),
            options)
    };

    BaseWrapper.prototype.isLiveUpdateEnabled = function () {
        return false
    };

    //
    // Wrapper API
    //

    BaseWrapper.prototype.createSurfaceAndUi = function (properties, values) {

    };

    BaseWrapper.prototype.setInspectorVisibleFlag = function (value) {
        this.$element.data('oc.inspectorVisible', value)
    };

    BaseWrapper.prototype.adoptSurface = function () {
        this.surface.options.onGetInspectableElement = this.proxy(this.onGetInspectableElement)
    };

    BaseWrapper.prototype.cleanupAfterSwitch = function () {
        this.switched = true;
        this.dispose()
    };

    //
    // Values
    //

    BaseWrapper.prototype.loadValues = function (configuration) {
        var $valuesField = this.getElementValuesInput();

        if ($valuesField.length > 0) {
            var valuesStr = $.trim($valuesField.val());

            try {
                return valuesStr.length === 0 ? {} : $.parseJSON(valuesStr)
            }
            catch (err) {
                throw new Error('Error parsing Inspector field values. ' + err)
            }
        }

        var values = {},
            attributes = this.$element.get(0).attributes;

        for (var i = 0, len = attributes.length; i < len; i++) {
            var attribute = attributes[i],
                matches = [];

            if (matches = attribute.name.match(/^data-property-(.*)$/)) {
                // Important - values contained in data-property-xxx attributes are
                // considered strings and never parsed with JSON. The use of the
                // data-property-xxx attributes is very limited - they're only
                // used in Pages for creating snippets from partials, where properties 
                // are created with a table UI widget, which doesn't allow creating 
                // properties of any complex types.
                //
                // There is no a technically reliable way to determine when a string
                // is a JSON data or a regular string. Users can enter a value
                // like [10], which is a proper JSON value, but meant to be a string.
                //
                // One possible way to resolve it, if to check the property type loaded
                // from the configuration and see if the corresponding editor expects
                // complex data.

                var normalizedPropertyName = this.normalizePropertyCode(matches[1], configuration);
                values[normalizedPropertyName] = attribute.value
            }
        }

        return values
    };

    BaseWrapper.prototype.applyValues = function (liveUpdateMode) {
        var $valuesField = this.getElementValuesInput(),
            values = liveUpdateMode ?
                this.surface.getValidValues() :
                this.surface.getValues();

        if (liveUpdateMode) {
            // In the live update mode, when only valid values are applied,
            // we don't want to change all other values (invalid properties).

            var existingValues = this.loadValues(this.configuration);

            for (var property in values) {
                if (values[property] !== Storm.inspector.invalidProperty) {
                    existingValues[property] = values[property]
                }
            }

            // Properties that use settings like ignoreIfPropertyEmpty could 
            // be removed from the list returned by getValidValues(). Removed
            // properties should be removed from the result list.

            var filteredValues = {};

            for (var property in existingValues) {
                if (values.hasOwnProperty(property)) {
                    filteredValues[property] = existingValues[property]
                }
            }


            values = filteredValues
        }

        if ($valuesField.length > 0) {
            $valuesField.val(JSON.stringify(values))
        }
        else {
            for (var property in values) {
                var value = values[property];

                if ($.isArray(value) || $.isPlainObject(value)) {
                    throw new Error('Inspector data-property-xxx attributes do not support complex values. Property: ' + property)
                }

                this.$element.attr('data-property-' + property, value)
            }
        }

        // In the live update mode the livechange event is triggered 
        // regardless of whether Surface properties match or don't match
        // the original properties of the inspectable element. Without it
        // there could be undesirable side effects.

        if (liveUpdateMode) {
            this.$element.trigger('livechange')
        }
        else {
            var hasChanges = false;

            if (this.isLiveUpdateEnabled()) {
                var currentValues = this.loadValues(this.configuration);

                // If the Inspector setup supports the live update mode,
                // evaluate changes as a difference between the current element
                // properties and internal properties stored in the Surface.
                // If there is no differences, the properties have already
                // been applied with a preceding live update.
                hasChanges = this.surface.hasChanges(currentValues)
            }
            else {
                hasChanges = this.surface.hasChanges()
            }

            if (hasChanges) {
                this.$element.trigger('change')
            }
        }
    };

    //
    // Configuration
    //

    BaseWrapper.prototype.loadConfiguration = function () {
        var configString = this.$element.data('inspector-config'),
            result = {
                properties: {},
                title: null,
                description: null
            };

        result.title = this.$element.data('inspector-title');
        result.description = this.$element.data('inspector-description');

        if (configString !== undefined) {
            result.properties = this.parseConfiguration(configString);

            this.configurationLoaded(result);
            return
        }

        var $configurationField = this.$element.find('> input[data-inspector-config]');

        if ($configurationField.length > 0) {
            result.properties = this.parseConfiguration($configurationField.val());

            this.configurationLoaded(result);
            return
        }

        var $form = this.$element.closest('form'),
            data = this.$element.data(),
            self = this;

        Storm.stripeLoadIndicator.show();
        $form.request('onGetInspectorConfiguration', {
            data: data
        }).done(function inspectorConfigurationRequestDoneClosure(data) {
            self.onConfigurartionRequestDone(data, result)
        }).always(function () {
            Storm.stripeLoadIndicator.hide()
        })
    };

    BaseWrapper.prototype.parseConfiguration = function (configuration) {
        if (!$.isArray(configuration) && !$.isPlainObject(configuration)) {
            if ($.trim(configuration) === 0) {
                return {}
            }

            try {
                return $.parseJSON(configuration)
            }
            catch (err) {
                throw new Error('Error parsing Inspector configuration. ' + err)
            }
        }
        else {
            return configuration
        }
    };

    BaseWrapper.prototype.configurationLoaded = function (configuration) {
        var values = this.loadValues(configuration.properties);

        this.title = configuration.title;
        this.description = configuration.description;
        this.configuration = configuration;

        this.createSurfaceAndUi(configuration.properties, values)
    };

    BaseWrapper.prototype.onConfigurartionRequestDone = function (data, result) {
        result.properties = this.parseConfiguration(data.configuration.properties);

        if (data.configuration.title !== undefined) {
            result.title = data.configuration.title
        }

        if (data.configuration.description !== undefined) {
            result.description = data.configuration.description
        }

        this.configurationLoaded(result)
    };

    //
    // Events
    //

    BaseWrapper.prototype.triggerShowingAndInit = function () {
        var e = $.Event('showing.oc.inspector');

        this.$element.trigger(e, [{callback: this.proxy(this.init)}]);
        if (e.isDefaultPrevented()) {
            this.$element = null;

            return false
        }

        if (!e.isPropagationStopped()) {
            this.init()
        }
    };

    BaseWrapper.prototype.triggerHiding = function () {
        var hidingEvent = $.Event('hiding.oc.inspector'),
            values = this.surface.getValues();

        this.$element.trigger(hidingEvent, [{values: values}]);
        return !hidingEvent.isDefaultPrevented();
    };

    BaseWrapper.prototype.onGetInspectableElement = function () {
        return this.$element
    };

    BaseWrapper.DEFAULTS = {
        containerSupported: false
    };

    Storm.inspector.wrappers.base = BaseWrapper
}(window.jQuery);
/*
 * Inspector popup wrapper.
 */
+function ($) {
    "use strict";

    // CLASS DEFINITION
    // ============================

    var Base = Storm.inspector.wrappers.base,
        BaseProto = Base.prototype;

    var InspectorPopup = function ($element, surface, options) {
        this.$popoverContainer = null;
        this.popoverObj = null;
        this.cleaningUp = false;

        Base.call(this, $element, surface, options)
    };

    InspectorPopup.prototype = Object.create(BaseProto);
    InspectorPopup.prototype.constructor = Base;

    InspectorPopup.prototype.dispose = function () {
        this.unregisterHandlers();

        this.$popoverContainer = null;
        this.popoverObj = null;

        BaseProto.dispose.call(this)
    };

    InspectorPopup.prototype.createSurfaceAndUi = function (properties, values, title, description) {
        this.showPopover();

        this.initSurface(this.$popoverContainer.find('[data-surface-container]').get(0), properties, values);
        this.repositionPopover();

        this.registerPopupHandlers()
    };

    InspectorPopup.prototype.adoptSurface = function () {
        this.showPopover();

        this.surface.moveToContainer(this.$popoverContainer.find('[data-surface-container]').get(0));
        this.repositionPopover();

        this.registerPopupHandlers();

        BaseProto.adoptSurface.call(this)
    };

    InspectorPopup.prototype.cleanupAfterSwitch = function () {
        this.cleaningUp = true;
        this.switched = true;

        this.forceClose();

        // The parent cleanupAfterSwitch() is not called because
        // disposing happens in onHide() triggered by forceClose()
    };

    InspectorPopup.prototype.getPopoverContents = function () {
        return '<div class="popover-head">                          \
                    <h3 data-inspector-title></h3>                  \
                    <p data-inspector-description></p>              \
                    <button type="button" class="close"             \
                        data-dismiss="popover"                      \
                        aria-hidden="true">&times;</button>         \
                </div>                                              \
                <form autocomplete="off" onsubmit="return false">   \
                    <div data-surface-container></div>              \
                <form>'
    };

    InspectorPopup.prototype.showPopover = function () {
        var offset = this.$element.data('inspector-offset'),
            offsetX = this.$element.data('inspector-offset-x'),
            offsetY = this.$element.data('inspector-offset-y'),
            placement = this.$element.data('inspector-placement'),
            fallbackPlacement = this.$element.data('inspector-fallback-placement');

        if (offset === undefined) {
            offset = 15
        }

        if (placement === undefined) {
            placement = 'bottom'
        }

        if (fallbackPlacement === undefined) {
            fallbackPlacement = 'bottom'
        }

        this.$element.ocPopover({
            content: this.getPopoverContents(),
            highlightModalTarget: true,
            modal: true,
            placement: placement,
            fallbackPlacement: fallbackPlacement,
            containerClass: 'control-inspector',
            container: this.$element.data('inspector-container'),
            offset: offset,
            offsetX: offsetX,
            offsetY: offsetY,
            width: 400
        });

        this.setInspectorVisibleFlag(true);

        this.popoverObj = this.$element.data('oc.popover');
        this.$popoverContainer = this.popoverObj.$container;

        this.$popoverContainer.addClass('inspector-temporary-placement');

        if (this.options.inspectorCssClass !== undefined) {
            this.$popoverContainer.addClass(this.options.inspectorCssClass)
        }

        if (this.options.containerSupported) {
            var moveToContainerButton = $('<span class="inspector-move-to-container oc-icon-download">');

            this.$popoverContainer.find('.popover-head').append(moveToContainerButton)
        }

        this.$popoverContainer.find('[data-inspector-title]').text(this.title);
        this.$popoverContainer.find('[data-inspector-description]').text(this.description)
    };

    InspectorPopup.prototype.repositionPopover = function () {
        this.popoverObj.reposition();
        this.$popoverContainer.removeClass('inspector-temporary-placement');
        this.$popoverContainer.find('div[data-surface-container] > div').trigger('focus-control')
    };

    InspectorPopup.prototype.forceClose = function () {
        this.$popoverContainer.trigger('close.oc.popover')
    };

    InspectorPopup.prototype.registerPopupHandlers = function () {
        this.surface.options.onPopupDisplayed = this.proxy(this.onPopupEditorDisplayed);
        this.surface.options.onPopupHidden = this.proxy(this.onPopupEditorHidden);
        this.popoverObj.options.onCheckDocumentClickTarget = this.proxy(this.onCheckDocumentClickTarget);

        this.$element.on('hiding.oc.popover', this.proxy(this.onBeforeHide));
        this.$element.on('hide.oc.popover', this.proxy(this.onHide));
        this.$popoverContainer.on('keydown', this.proxy(this.onPopoverKeyDown));

        if (this.options.containerSupported) {
            this.$popoverContainer.on('click', 'span.inspector-move-to-container', this.proxy(this.onMoveToContainer))
        }
    };

    InspectorPopup.prototype.unregisterHandlers = function () {
        this.popoverObj.options.onCheckDocumentClickTarget = null;

        this.$element.off('hiding.oc.popover', this.proxy(this.onBeforeHide));
        this.$element.off('hide.oc.popover', this.proxy(this.onHide));
        this.$popoverContainer.off('keydown', this.proxy(this.onPopoverKeyDown));

        if (this.options.containerSupported) {
            this.$popoverContainer.off('click', 'span.inspector-move-to-container', this.proxy(this.onMoveToContainer))
        }

        this.surface.options.onPopupDisplayed = null;
        this.surface.options.onPopupHidden = null
    };

    InspectorPopup.prototype.onBeforeHide = function (ev) {
        if (this.cleaningUp) {
            return
        }

        if (!this.surface.validate()) {
            ev.preventDefault();
            return false
        }

        if (!this.triggerHiding()) {
            ev.preventDefault();
            return false
        }

        this.applyValues()
    };

    InspectorPopup.prototype.onHide = function (ev) {
        this.dispose()
    };

    InspectorPopup.prototype.onPopoverKeyDown = function (ev) {
        if (ev.keyCode == 13) {
            $(ev.currentTarget).trigger('close.oc.popover')
        }
    };

    InspectorPopup.prototype.onPopupEditorDisplayed = function () {
        this.popoverObj.options.closeOnPageClick = false;
        this.popoverObj.options.closeOnEsc = false
    };

    InspectorPopup.prototype.onPopupEditorHidden = function () {
        this.popoverObj.options.closeOnPageClick = true;
        this.popoverObj.options.closeOnEsc = true
    };

    InspectorPopup.prototype.onCheckDocumentClickTarget = function (element) {
        if ($.contains(this.$element, element) || this.$element.get(0) === element) {
            return true
        }
    };

    InspectorPopup.prototype.onMoveToContainer = function () {
        Storm.inspector.manager.switchToContainer(this)
    };

    Storm.inspector.wrappers.popup = InspectorPopup
}(window.jQuery);
/*
 * Inspector container wrapper.
 */
+function ($) {
    "use strict";

    // CLASS DEFINITION
    // ============================

    var Base = Storm.inspector.wrappers.base,
        BaseProto = Base.prototype;

    var InspectorContainer = function ($element, surface, options) {
        if (!options.container) {
            throw new Error('Cannot create Inspector container wrapper without a container element.')
        }

        this.surfaceContainer = null;

        Base.call(this, $element, surface, options)
    };

    InspectorContainer.prototype = Object.create(BaseProto);
    InspectorContainer.prototype.constructor = Base;

    InspectorContainer.prototype.init = function () {
        this.registerHandlers();

        BaseProto.init.call(this)
    };

    InspectorContainer.prototype.dispose = function () {
        this.unregisterHandlers();
        this.removeControls();

        this.surfaceContainer = null;

        BaseProto.dispose.call(this)
    };

    InspectorContainer.prototype.createSurfaceAndUi = function (properties, values) {
        this.buildUi();

        this.initSurface(this.surfaceContainer, properties, values);

        if (this.isLiveUpdateEnabled()) {
            this.surface.options.onChange = this.proxy(this.onLiveUpdate)
        }
    };

    InspectorContainer.prototype.adoptSurface = function () {
        this.buildUi();

        this.surface.moveToContainer(this.surfaceContainer);

        if (this.isLiveUpdateEnabled()) {
            this.surface.options.onChange = this.proxy(this.onLiveUpdate)
        }

        BaseProto.adoptSurface.call(this)
    };

    InspectorContainer.prototype.buildUi = function () {
        var scrollable = this.isScrollable(),
            head = this.buildHead(),
            layoutElements = this.buildLayout();

        layoutElements.headContainer.appendChild(head);

        if (scrollable) {
            var scrollpad = this.buildScrollpad();

            this.surfaceContainer = scrollpad.container;
            layoutElements.bodyContainer.appendChild(scrollpad.scrollpad);

            $(scrollpad.scrollpad).scrollpad()
        }
        else {
            this.surfaceContainer = layoutElements.bodyContainer
        }

        this.setInspectorVisibleFlag(true)
    };

    InspectorContainer.prototype.buildHead = function () {
        var container = document.createElement('div'),
            header = document.createElement('h3'),
            paragraph = document.createElement('p'),
            detachButton = document.createElement('span'),
            closeButton = document.createElement('span');

        container.setAttribute('class', 'inspector-header');
        detachButton.setAttribute('class', 'oc-icon-external-link-square detach');
        closeButton.setAttribute('class', 'close');

        header.textContent = this.title;
        paragraph.textContent = this.description;
        closeButton.innerHTML = '&times;';

        container.appendChild(header);
        container.appendChild(paragraph);
        container.appendChild(detachButton);
        container.appendChild(closeButton);

        return container
    };

    InspectorContainer.prototype.buildScrollpad = function () {
        var scrollpad = document.createElement('div'),
            scrollWrapper = document.createElement('div'),
            scrollableContainer = document.createElement('div');

        scrollpad.setAttribute('class', 'control-scrollpad');
        scrollpad.setAttribute('data-control', 'scrollpad');
        scrollWrapper.setAttribute('class', 'scroll-wrapper inspector-wrapper');

        scrollpad.appendChild(scrollWrapper);
        scrollWrapper.appendChild(scrollableContainer);

        return {
            scrollpad: scrollpad,
            container: scrollableContainer
        }
    };

    InspectorContainer.prototype.buildLayout = function () {
        var layout = document.createElement('div'),
            headRow = document.createElement('div'),
            bodyRow = document.createElement('div');

        layout.setAttribute('class', 'flex-layout-column fill-container');
        headRow.setAttribute('class', 'flex-layout-item fix');
        bodyRow.setAttribute('class', 'flex-layout-item stretch relative');

        layout.appendChild(headRow);
        layout.appendChild(bodyRow);

        this.options.container.get(0).appendChild(layout);

        Storm.foundation.controlUtils.markDisposable(layout);
        this.registerLayoutHandlers(layout);

        return {
            headContainer: headRow,
            bodyContainer: bodyRow
        }
    };

    InspectorContainer.prototype.validateAndApply = function () {
        if (!this.surface.validate()) {
            return false
        }

        this.applyValues();
        return true
    };

    InspectorContainer.prototype.isScrollable = function () {
        return this.options.container.data('inspector-scrollable') !== undefined
    };

    InspectorContainer.prototype.isLiveUpdateEnabled = function () {
        return this.options.container.data('inspector-live-update') !== undefined
    };

    InspectorContainer.prototype.getLayout = function () {
        return this.options.container.get(0).querySelector('div.flex-layout-column')
    };

    InspectorContainer.prototype.registerLayoutHandlers = function (layout) {
        var $layout = $(layout);

        $layout.one('dispose-control', this.proxy(this.dispose));
        $layout.on('click', 'span.close', this.proxy(this.onClose));
        $layout.on('click', 'span.detach', this.proxy(this.onDetach))
    };

    InspectorContainer.prototype.registerHandlers = function () {
        this.options.container.on('apply.oc.inspector', this.proxy(this.onApplyValues));
        this.options.container.on('beforeContainerHide.oc.inspector', this.proxy(this.onBeforeHide))
    };

    InspectorContainer.prototype.unregisterHandlers = function () {
        var $layout = $(this.getLayout());

        this.options.container.off('apply.oc.inspector', this.proxy(this.onApplyValues));
        this.options.container.off('beforeContainerHide.oc.inspector', this.proxy(this.onBeforeHide));

        $layout.off('dispose-control', this.proxy(this.dispose));
        $layout.off('click', 'span.close', this.proxy(this.onClose));
        $layout.off('click', 'span.detach', this.proxy(this.onDetach));

        if (this.surface !== null && this.surface.options.onChange === this.proxy(this.onLiveUpdate)) {
            this.surface.options.onChange = null
        }
    };

    InspectorContainer.prototype.removeControls = function () {
        if (this.isScrollable()) {
            this.options.container.find('.control-scrollpad').scrollpad('dispose')
        }

        var layout = this.getLayout();
        layout.parentNode.removeChild(layout)
    };

    InspectorContainer.prototype.onApplyValues = function (ev) {
        if (!this.validateAndApply()) {
            ev.preventDefault();
            return false
        }
    };

    InspectorContainer.prototype.onBeforeHide = function (ev) {
        if (!this.triggerHiding()) {
            ev.preventDefault();
            return false
        }
    };

    InspectorContainer.prototype.onClose = function (ev) {
        if (!this.validateAndApply()) {
            ev.preventDefault();
            return false
        }

        if (!this.triggerHiding()) {
            ev.preventDefault();
            return false
        }

        this.surface.dispose();

        this.dispose()
    };

    InspectorContainer.prototype.onLiveUpdate = function () {
        this.applyValues(true)
    };

    InspectorContainer.prototype.onDetach = function () {
        Storm.inspector.manager.switchToPopup(this)
    };

    Storm.inspector.wrappers.container = InspectorContainer
}(window.jQuery);
/*
 * Inspector grouping support.
 *
 */
+function ($) {
    "use strict";

    // GROUP MANAGER CLASS
    // ============================

    var GroupManager = function (controlId) {
        this.controlId = controlId;
        this.rootGroup = null;
        this.cachedGroupStatuses = null
    };

    GroupManager.prototype.createGroup = function (groupId, parentGroup) {
        var group = new Group(groupId);

        if (parentGroup) {
            parentGroup.groups.push(group);
            group.parentGroup = parentGroup; // Circular reference, but memory leaks are not noticed
        }
        else {
            this.rootGroup = group
        }

        return group
    };

    GroupManager.prototype.getGroupIndex = function (group) {
        return group.getGroupIndex()
    };

    GroupManager.prototype.isParentGroupExpanded = function (group) {
        if (!group.parentGroup) {
            // The root group is always expanded
            return true
        }

        return this.isGroupExpanded(group.parentGroup)
    };

    GroupManager.prototype.isGroupExpanded = function (group) {
        if (!group.parentGroup) {
            // The root group is always expanded
            return true
        }

        var groupIndex = this.getGroupIndex(group),
            statuses = this.readGroupStatuses();

        if (statuses[groupIndex] !== undefined) {
            return statuses[groupIndex]
        }

        return false
    };

    GroupManager.prototype.setGroupStatus = function (groupIndex, expanded) {
        var statuses = this.readGroupStatuses();

        statuses[groupIndex] = expanded;

        this.writeGroupStatuses(statuses)
    };

    GroupManager.prototype.readGroupStatuses = function () {
        if (this.cachedGroupStatuses !== null) {
            return this.cachedGroupStatuses
        }

        var statuses = getInspectorGroupStatuses();

        if (statuses[this.controlId] !== undefined) {
            this.cachedGroupStatuses = statuses[this.controlId]
        }
        else {
            this.cachedGroupStatuses = {}
        }

        return this.cachedGroupStatuses
    };

    GroupManager.prototype.writeGroupStatuses = function (updatedStatuses) {
        var statuses = getInspectorGroupStatuses();

        statuses[this.controlId] = updatedStatuses;
        setInspectorGroupStatuses(statuses);

        this.cachedGroupStatuses = updatedStatuses
    };

    GroupManager.prototype.findGroupByIndex = function (index) {
        return this.rootGroup.findGroupByIndex(index)
    };

    GroupManager.prototype.findGroupRows = function (table, index, ignoreCollapsedSubgroups) {
        var group = this.findGroupByIndex(index);

        if (!group) {
            throw new Error('Cannot find the requested row group.')
        }

        return group.findGroupRows(table, ignoreCollapsedSubgroups, this)
    };

    GroupManager.prototype.markGroupRowInvalid = function (group, table) {
        var currentGroup = group;

        while (currentGroup) {
            var row = currentGroup.findGroupRow(table);
            if (row) {
                Storm.foundation.element.addClass(row, 'invalid')
            }

            currentGroup = currentGroup.parentGroup
        }
    };

    GroupManager.prototype.unmarkInvalidGroups = function (table) {
        var rows = table.querySelectorAll('tr.invalid');

        for (var i = rows.length - 1; i >= 0; i--) {
            Storm.foundation.element.removeClass(rows[i], 'invalid')
        }
    };

    GroupManager.prototype.isRowVisible = function (table, rowGroupIndex) {
        var group = this.findGroupByIndex(index);

        if (!group) {
            throw new Error('Cannot find the requested row group.')
        }

        var current = group;

        while (current) {
            if (!this.isGroupExpanded(current)) {
                return false
            }

            current = current.parentGroup
        }

        return true
    };

    //
    // Internal functions
    //

    function getInspectorGroupStatuses() {
        var statuses = document.body.getAttribute('data-inspector-group-statuses');

        if (statuses !== null) {
            return JSON.parse(statuses)
        }

        return {}
    }

    function setInspectorGroupStatuses(statuses) {
        document.body.setAttribute('data-inspector-group-statuses', JSON.stringify(statuses))
    }

    // GROUP CLASS
    // ============================

    var Group = function (groupId) {
        this.groupId = groupId;
        this.parentGroup = null;
        this.groupIndex = null;

        this.groups = []
    };

    Group.prototype.getGroupIndex = function () {
        if (this.groupIndex !== null) {
            return this.groupIndex
        }

        var result = '',
            current = this;

        while (current) {
            if (result.length > 0) {
                result = current.groupId + '-' + result
            }
            else {
                result = String(current.groupId)
            }

            current = current.parentGroup
        }

        this.groupIndex = result;

        return result
    };

    Group.prototype.findGroupByIndex = function (index) {
        if (this.getGroupIndex() == index) {
            return this
        }

        for (var i = this.groups.length - 1; i >= 0; i--) {
            var groupResult = this.groups[i].findGroupByIndex(index);
            if (groupResult !== null) {
                return groupResult
            }
        }

        return null
    };

    Group.prototype.getLevel = function () {
        var current = this,
            level = -1;

        while (current) {
            level++;

            current = current.parentGroup
        }

        return level
    };

    Group.prototype.getGroupAndAllParents = function () {
        var current = this,
            result = [];

        while (current) {
            result.push(current);

            current = current.parentGroup
        }

        return result
    };

    Group.prototype.findGroupRows = function (table, ignoreCollapsedSubgroups, groupManager) {
        var groupIndex = this.getGroupIndex(),
            rows = table.querySelectorAll('tr[data-parent-group-index="' + groupIndex + '"]'),
            result = Array.prototype.slice.call(rows); // Convert node list to array

        for (var i = 0, len = this.groups.length; i < len; i++) {
            var subgroup = this.groups[i];

            if (ignoreCollapsedSubgroups && !groupManager.isGroupExpanded(subgroup)) {
                continue
            }

            var subgroupRows = subgroup.findGroupRows(table, ignoreCollapsedSubgroups, groupManager);
            for (var j = 0, subgroupLen = subgroupRows.length; j < subgroupLen; j++) {
                result.push(subgroupRows[j])
            }
        }

        return result
    };

    Group.prototype.findGroupRow = function (table) {
        return table.querySelector('tr[data-group-index="' + this.groupIndex + '"]')
    };

    Storm.inspector.groupManager = GroupManager
}(window.jQuery);
/*
 * Inspector engine helpers.
 *
 * The helpers are used mostly by the Inspector Surface.
 *
 */
+function ($) {
    "use strict";

    // NAMESPACES
    // ============================

    if (window.Storm === undefined) {
        window.Storm = {};
    }

    if (Storm.inspector === undefined)
        Storm.inspector = {};

    Storm.inspector.engine = {};

    // CLASS DEFINITION
    // ============================

    function findGroup(group, properties) {
        for (var i = 0, len = properties.length; i < len; i++) {
            var property = properties[i];

            if (property.itemType !== undefined && property.itemType == 'group' && property.title == group) {
                return property
            }
        }

        return null
    }

    Storm.inspector.engine.processPropertyGroups = function (properties) {
        var fields = [],
            result = {
                hasGroups: false,
                properties: []
            },
            groupIndex = 0;

        for (var i = 0, len = properties.length; i < len; i++) {
            var property = properties[i];

            if (property['sortOrder'] === undefined) {
                property['sortOrder'] = (i + 1) * 20
            }
        }

        properties.sort(function (a, b) {
            return a['sortOrder'] - b['sortOrder']
        });

        for (var i = 0, len = properties.length; i < len; i++) {
            var property = properties[i];

            property.itemType = 'property';

            if (property.group === undefined) {
                fields.push(property)
            }
            else {
                var group = findGroup(property.group, fields);

                if (!group) {
                    group = {
                        itemType: 'group',
                        title: property.group,
                        properties: [],
                        groupIndex: groupIndex
                    };

                    groupIndex++;
                    fields.push(group)
                }

                property.groupIndex = group.groupIndex;
                group.properties.push(property)
            }
        }

        for (var i = 0, len = fields.length; i < len; i++) {
            var property = fields[i];

            result.properties.push(property);

            if (property.itemType == 'group') {
                result.hasGroups = true;

                for (var j = 0, propertiesLen = property.properties.length; j < propertiesLen; j++) {
                    result.properties.push(property.properties[j])
                }

                delete property.properties
            }
        }

        return result
    }
}(window.jQuery);

/*
 * Inspector editor base class.
 */
+function ($) {
    "use strict";

    // NAMESPACES
    // ============================

    if (window.Storm === undefined) {
        window.Storm = {};
    }

    if (Storm.inspector === undefined)
        Storm.inspector = {};

    if (Storm.inspector.propertyEditors === undefined)
        Storm.inspector.propertyEditors = {};

    // CLASS DEFINITION
    // ============================

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var BaseEditor = function (inspector, propertyDefinition, containerCell, group) {
        this.inspector = inspector;
        this.propertyDefinition = propertyDefinition;
        this.containerCell = containerCell;
        this.containerRow = containerCell.parentNode;
        this.parentGroup = group;
        this.group = null; // Group created by a grouped editor, for example by the set editor
        this.childInspector = null;
        this.validationSet = null;
        this.disposed = false;

        Base.call(this);

        this.init()
    };

    BaseEditor.prototype = Object.create(BaseProto);
    BaseEditor.prototype.constructor = Base;

    BaseEditor.prototype.dispose = function () {
        this.disposed = true; // After this point editors can't rely on any DOM references

        this.disposeValidation();

        if (this.childInspector) {
            this.childInspector.dispose()
        }

        this.inspector = null;
        this.propertyDefinition = null;
        this.containerCell = null;
        this.containerRow = null;
        this.childInspector = null;
        this.parentGroup = null;
        this.group = null;
        this.validationSet = null;

        BaseProto.dispose.call(this)
    };

    BaseEditor.prototype.init = function () {
        this.build();
        this.registerHandlers();
        this.initValidation()
    };

    BaseEditor.prototype.build = function () {
        return null
    };

    BaseEditor.prototype.isDisposed = function () {
        return this.disposed
    };

    BaseEditor.prototype.registerHandlers = function () {
    };

    BaseEditor.prototype.onInspectorPropertyChanged = function (property, value) {
    };

    BaseEditor.prototype.notifyChildSurfacesPropertyChanged = function (property, value) {
        if (!this.hasChildSurface()) {
            return
        }

        this.childInspector.notifyEditorsPropertyChanged(property, value)
    };

    BaseEditor.prototype.focus = function () {
    };

    BaseEditor.prototype.hasChildSurface = function () {
        return this.childInspector !== null
    };

    BaseEditor.prototype.getRootSurface = function () {
        return this.inspector.getRootSurface()
    };

    BaseEditor.prototype.getPropertyPath = function () {
        return this.inspector.getPropertyPath(this.propertyDefinition.property)
    };

    /**
     * Updates displayed value in the editor UI. The value is already set
     * in the Inspector and should be loaded from Inspector.
     */
    BaseEditor.prototype.updateDisplayedValue = function (value) {
    };

    BaseEditor.prototype.getPropertyName = function () {
        return this.propertyDefinition.property
    };

    BaseEditor.prototype.getUndefinedValue = function () {
        return this.propertyDefinition.default === undefined ? undefined : this.propertyDefinition.default
    };

    BaseEditor.prototype.throwError = function (errorMessage) {
        throw new Error(errorMessage + ' Property: ' + this.propertyDefinition.property)
    };

    BaseEditor.prototype.getInspectableElement = function () {
        return this.getRootSurface().getInspectableElement()
    };

    BaseEditor.prototype.isEmptyValue = function (value) {
        return value === undefined
            || value === null
            || (typeof value == 'object' && $.isEmptyObject(value) )
            || (typeof value == 'string' && $.trim(value).length === 0)
            || (Object.prototype.toString.call(value) === '[object Array]' && value.length === 0)
    };

    //
    // Validation
    //

    BaseEditor.prototype.initValidation = function () {
        this.validationSet = new Storm.inspector.validationSet(this.propertyDefinition, this.propertyDefinition.property)
    };

    BaseEditor.prototype.disposeValidation = function () {
        this.validationSet.dispose()
    };

    BaseEditor.prototype.getValueToValidate = function () {
        return this.inspector.getPropertyValue(this.propertyDefinition.property)
    };

    BaseEditor.prototype.validate = function (silentMode) {
        var value = this.getValueToValidate();

        if (value === undefined) {
            value = this.getUndefinedValue()
        }

        var validationResult = this.validationSet.validate(value);
        if (validationResult !== null) {
            if (!silentMode) {
                Storm.flashMsg({text: validationResult, 'class': 'error', 'interval': 5})
            }
            return false
        }

        return true
    };

    BaseEditor.prototype.markInvalid = function () {
        Storm.foundation.element.addClass(this.containerRow, 'invalid');
        this.inspector.getGroupManager().markGroupRowInvalid(this.parentGroup, this.inspector.getRootTable());

        this.inspector.getRootSurface().expandGroupParents(this.parentGroup);
        this.focus()
    };

    //
    // External editor
    //

    BaseEditor.prototype.supportsExternalParameterEditor = function () {
        return true
    };

    BaseEditor.prototype.onExternalPropertyEditorHidden = function () {
    };

    //
    // Grouping
    //

    BaseEditor.prototype.isGroupedEditor = function () {
        return false
    };

    BaseEditor.prototype.initControlGroup = function () {
        this.group = this.inspector.getGroupManager().createGroup(this.propertyDefinition.property, this.parentGroup)
    };

    BaseEditor.prototype.createGroupedRow = function (property) {
        var row = this.inspector.buildRow(property, this.group),
            groupedClass = this.inspector.getGroupManager().isGroupExpanded(this.group) ? 'expanded' : 'collapsed';

        this.inspector.applyGroupLevelToRow(row, this.group);

        Storm.foundation.element.addClass(row, 'property');
        Storm.foundation.element.addClass(row, groupedClass);
        return row
    };

    Storm.inspector.propertyEditors.base = BaseEditor
}(window.jQuery);
/*
 * Inspector string editor class.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.base,
        BaseProto = Base.prototype;

    var StringEditor = function (inspector, propertyDefinition, containerCell, group) {
        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    StringEditor.prototype = Object.create(BaseProto);
    StringEditor.prototype.constructor = Base;

    StringEditor.prototype.dispose = function () {
        this.unregisterHandlers();

        BaseProto.dispose.call(this)
    };

    StringEditor.prototype.build = function () {
        var editor = document.createElement('input'),
            placeholder = this.propertyDefinition.placeholder !== undefined ? this.propertyDefinition.placeholder : '',
            value = this.inspector.getPropertyValue(this.propertyDefinition.property);

        editor.setAttribute('type', 'text');
        editor.setAttribute('class', 'string-editor');
        editor.setAttribute('placeholder', placeholder);

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        if (value === undefined) {
            value = ''
        }

        editor.value = value;

        Storm.foundation.element.addClass(this.containerCell, 'text');

        this.containerCell.appendChild(editor)
    };

    StringEditor.prototype.updateDisplayedValue = function (value) {
        this.getInput().value = value
    };

    StringEditor.prototype.getInput = function () {
        return this.containerCell.querySelector('input')
    };

    StringEditor.prototype.focus = function () {
        this.getInput().focus();
        this.onInputFocus()
    };

    StringEditor.prototype.registerHandlers = function () {
        var input = this.getInput();

        input.addEventListener('focus', this.proxy(this.onInputFocus));
        input.addEventListener('keyup', this.proxy(this.onInputKeyUp))
    };

    StringEditor.prototype.unregisterHandlers = function () {
        var input = this.getInput();

        input.removeEventListener('focus', this.proxy(this.onInputFocus));
        input.removeEventListener('keyup', this.proxy(this.onInputKeyUp))
    };

    StringEditor.prototype.onInputFocus = function (ev) {
        this.inspector.makeCellActive(this.containerCell)
    };

    StringEditor.prototype.onInputKeyUp = function () {
        var value = $.trim(this.getInput().value);

        this.inspector.setPropertyValue(this.propertyDefinition.property, value)
    };

    StringEditor.prototype.onExternalPropertyEditorHidden = function () {
        this.focus()
    };

    Storm.inspector.propertyEditors.string = StringEditor
}(window.jQuery);
/*
 * Inspector checkbox editor class.
 *
 * This editor is used in Storm.inspector.propertyEditors.set class.
 * If updates that affect references to this.inspector and propertyDefinition are done,
 * the propertyEditors.set class implementation should be reviewed.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.base,
        BaseProto = Base.prototype;

    var CheckboxEditor = function (inspector, propertyDefinition, containerCell, group) {
        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    CheckboxEditor.prototype = Object.create(BaseProto);
    CheckboxEditor.prototype.constructor = Base;

    CheckboxEditor.prototype.dispose = function () {
        this.unregisterHandlers();

        BaseProto.dispose.call(this)
    };

    CheckboxEditor.prototype.build = function () {
        var editor = document.createElement('input'),
            container = document.createElement('div'),
            value = this.inspector.getPropertyValue(this.propertyDefinition.property),
            label = document.createElement('label'),
            isChecked = false,
            id = this.inspector.generateSequencedId();

        container.setAttribute('tabindex', 0);
        container.setAttribute('class', 'custom-checkbox nolabel');

        editor.setAttribute('type', 'checkbox');
        editor.setAttribute('value', '1');
        editor.setAttribute('placeholder', 'placeholder');
        editor.setAttribute('id', id);

        label.setAttribute('for', id);
        label.textContent = this.propertyDefinition.title;

        container.appendChild(editor);
        container.appendChild(label);

        if (value === undefined) {
            if (this.propertyDefinition.default !== undefined) {
                isChecked = this.normalizeCheckedValue(this.propertyDefinition.default)
            }
        }
        else {
            isChecked = this.normalizeCheckedValue(value)
        }

        editor.checked = isChecked;

        this.containerCell.appendChild(container)
    };

    CheckboxEditor.prototype.normalizeCheckedValue = function (value) {
        if (value == '0' || value == 'false') {
            return false
        }

        return value
    };

    CheckboxEditor.prototype.getInput = function () {
        return this.containerCell.querySelector('input')
    };

    CheckboxEditor.prototype.focus = function () {
        this.getInput().parentNode.focus()
    };

    CheckboxEditor.prototype.updateDisplayedValue = function (value) {
        this.getInput().checked = this.normalizeCheckedValue(value)
    };

    CheckboxEditor.prototype.isEmptyValue = function (value) {
        if (value === 0 || value === '0' || value === 'false') {
            return true
        }

        return BaseProto.isEmptyValue.call(this, value)
    };

    CheckboxEditor.prototype.registerHandlers = function () {
        var input = this.getInput();

        input.addEventListener('change', this.proxy(this.onInputChange))
    };

    CheckboxEditor.prototype.unregisterHandlers = function () {
        var input = this.getInput();

        input.removeEventListener('change', this.proxy(this.onInputChange))
    };

    CheckboxEditor.prototype.onInputChange = function () {
        var isChecked = this.getInput().checked;

        this.inspector.setPropertyValue(this.propertyDefinition.property, isChecked ? 1 : 0)
    };

    Storm.inspector.propertyEditors.checkbox = CheckboxEditor
}(window.jQuery);
/*
 * Inspector checkbox dropdown class.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.base,
        BaseProto = Base.prototype;

    var DropdownEditor = function (inspector, propertyDefinition, containerCell, group) {
        this.indicatorContainer = null;

        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    DropdownEditor.prototype = Object.create(BaseProto);
    DropdownEditor.prototype.constructor = Base;

    DropdownEditor.prototype.init = function () {
        this.dynamicOptions = this.propertyDefinition.options ? false : true;
        this.initialization = false;

        BaseProto.init.call(this)
    };

    DropdownEditor.prototype.dispose = function () {
        this.unregisterHandlers();
        this.destroyCustomSelect();

        this.indicatorContainer = null;

        BaseProto.dispose.call(this)
    };

    //
    // Building
    //

    DropdownEditor.prototype.build = function () {
        var select = document.createElement('select');

        Storm.foundation.element.addClass(this.containerCell, 'dropdown');
        Storm.foundation.element.addClass(select, 'custom-select');

        if (!this.dynamicOptions) {
            this.loadStaticOptions(select)
        }

        this.containerCell.appendChild(select);

        this.initCustomSelect();

        if (this.dynamicOptions) {
            this.loadDynamicOptions(true)
        }
    };

    DropdownEditor.prototype.formatSelectOption = function (state) {
        if (!state.id)
            return state.text; // optgroup

        var option = state.element,
            iconClass = option.getAttribute('data-icon'),
            imageSrc = option.getAttribute('data-image');

        if (iconClass) {
            return '<i class="select-icon ' + iconClass + '"></i> ' + state.text
        }

        if (imageSrc) {
            return '<img class="select-image" src="' + imageSrc + '" alt="" /> ' + state.text
        }

        return state.text
    };

    DropdownEditor.prototype.createOption = function (select, title, value) {
        var option = document.createElement('option');

        if (title !== null) {
            if (!$.isArray(title)) {
                option.textContent = title
            } else {
                if (title[1].indexOf('.') !== -1) {
                    option.setAttribute('data-image', title[1])
                }
                else {
                    option.setAttribute('data-icon', title[1])
                }

                option.textContent = title[0]
            }
        }

        if (value !== null) {
            option.value = value
        }

        select.appendChild(option)
    };

    DropdownEditor.prototype.createOptions = function (select, options) {
        for (var value in options) {
            this.createOption(select, options[value], value)
        }
    };

    DropdownEditor.prototype.initCustomSelect = function () {
        var select = this.getSelect();

        if (Modernizr.touch) {
            return
        }

        var options = {
            dropdownCssClass: 'ocInspectorDropdown'
        };

        if (this.propertyDefinition.placeholder !== undefined) {
            options.placeholder = this.propertyDefinition.placeholder
        }

        options.templateResult = this.formatSelectOption;
        options.templateSelection = this.formatSelectOption;
        options.escapeMarkup = function (m) {
            return m
        };

        $(select).select2(options);

        if (!Modernizr.touch) {
            this.indicatorContainer = $('.select2-container', this.containerCell);
            this.indicatorContainer.addClass('loading-indicator-container size-small')
        }
    };

    DropdownEditor.prototype.createPlaceholder = function (select) {
        var placeholder = this.propertyDefinition.placeholder;

        if (placeholder !== undefined && !Modernizr.touch) {
            this.createOption(select, null, null)
        }

        if (placeholder !== undefined && Modernizr.touch) {
            this.createOption(select, placeholder, null)
        }
    };

    //
    // Helpers
    //

    DropdownEditor.prototype.getSelect = function () {
        return this.containerCell.querySelector('select')
    };

    DropdownEditor.prototype.clearOptions = function (select) {
        while (select.firstChild) {
            select.removeChild(select.firstChild)
        }
    };

    DropdownEditor.prototype.hasOptionValue = function (select, value) {
        var options = select.children;

        for (var i = 0, len = options.length; i < len; i++) {
            if (options[i].value == value) {
                return true
            }
        }

        return false
    };

    DropdownEditor.prototype.normalizeValue = function (value) {
        if (!this.propertyDefinition.booleanValues) {
            return value
        }

        var str = String(value);

        if (str.length === 0) {
            return ''
        }

        if (str === 'true') {
            return true
        }

        return false
    };

    //
    // Event handlers
    //

    DropdownEditor.prototype.registerHandlers = function () {
        var select = this.getSelect();

        $(select).on('change', this.proxy(this.onSelectionChange))
    };

    DropdownEditor.prototype.onSelectionChange = function () {
        var select = this.getSelect();

        this.inspector.setPropertyValue(this.propertyDefinition.property, this.normalizeValue(select.value), this.initialization)
    };

    DropdownEditor.prototype.onInspectorPropertyChanged = function (property, value) {
        if (!this.propertyDefinition.depends || this.propertyDefinition.depends.indexOf(property) === -1) {
            return
        }

        var dependencyValues = this.getDependencyValues();

        if (this.prevDependencyValues === undefined || this.prevDependencyValues != dependencyValues) {
            this.loadDynamicOptions()
        }
    };

    DropdownEditor.prototype.onExternalPropertyEditorHidden = function () {
        if (this.dynamicOptions) {
            this.loadDynamicOptions(false)
        }
    };

    //
    // Editor API methods
    //

    DropdownEditor.prototype.updateDisplayedValue = function (value) {
        var select = this.getSelect();

        select.value = value
    };

    DropdownEditor.prototype.getUndefinedValue = function () {
        // Return default value if the default value is defined
        if (this.propertyDefinition.default !== undefined) {
            return this.propertyDefinition.default
        }

        // Return undefined if there's a placeholder value
        if (this.propertyDefinition.placeholder !== undefined) {
            return undefined
        }

        // Otherwise - return the first value in the list
        var select = this.getSelect();

        if (select) {
            return this.normalizeValue(select.value)
        }

        return undefined
    };

    DropdownEditor.prototype.isEmptyValue = function (value) {
        if (this.propertyDefinition.booleanValues) {
            if (value === '') {
                return true
            }

            return false
        }

        return BaseProto.isEmptyValue.call(this, value)
    };

    //
    // Disposing
    //

    DropdownEditor.prototype.destroyCustomSelect = function () {
        var $select = $(this.getSelect());

        if ($select.data('select2') != null) {
            $select.select2('destroy')
        }
    };

    DropdownEditor.prototype.unregisterHandlers = function () {
        var select = this.getSelect();

        $(select).off('change', this.proxy(this.onSelectionChange))
    };

    //
    // Static options
    //

    DropdownEditor.prototype.loadStaticOptions = function (select) {
        var value = this.inspector.getPropertyValue(this.propertyDefinition.property);

        this.createPlaceholder(select);

        this.createOptions(select, this.propertyDefinition.options);

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        select.value = value
    };

    //
    // Dynamic options
    //

    DropdownEditor.prototype.loadDynamicOptions = function (initialization) {
        var currentValue = this.inspector.getPropertyValue(this.propertyDefinition.property),
            data = this.getRootSurface().getValues(),
            self = this,
            $form = $(this.getSelect()).closest('form');

        if (currentValue === undefined) {
            currentValue = this.propertyDefinition.default
        }

        var callback = function dropdownOptionsRequestDoneClosure(data) {
            self.hideLoadingIndicator();
            self.optionsRequestDone(data, currentValue, true)
        };

        if (this.propertyDefinition.depends) {
            this.saveDependencyValues()
        }

        data['inspectorProperty'] = this.getPropertyPath();
        data['inspectorClassName'] = this.inspector.options.inspectorClass;

        this.showLoadingIndicator();

        if (this.triggerGetOptions(data, callback) === false) {
            return
        }

        $form.request('onInspectableGetOptions', {
            data: data,
        }).done(callback).always(
            this.proxy(this.hideLoadingIndicator)
        )
    };

    DropdownEditor.prototype.triggerGetOptions = function (values, callback) {
        var $inspectable = this.getInspectableElement();
        if (!$inspectable) {
            return true
        }

        var optionsEvent = $.Event('dropdownoptions.oc.inspector');

        $inspectable.trigger(optionsEvent, [{
            values: values,
            callback: callback,
            property: this.inspector.getPropertyPath(this.propertyDefinition.property),
            propertyDefinition: this.propertyDefinition
        }]);

        if (optionsEvent.isDefaultPrevented()) {
            return false
        }

        return true
    };

    DropdownEditor.prototype.saveDependencyValues = function () {
        this.prevDependencyValues = this.getDependencyValues()
    };

    DropdownEditor.prototype.getDependencyValues = function () {
        var result = '';

        for (var i = 0, len = this.propertyDefinition.depends.length; i < len; i++) {
            var property = this.propertyDefinition.depends[i],
                value = this.inspector.getPropertyValue(property);

            if (value === undefined) {
                value = '';
            }

            result += property + ':' + value + '-'
        }

        return result
    };

    DropdownEditor.prototype.showLoadingIndicator = function () {
        if (!Modernizr.touch) {
            this.indicatorContainer.loadIndicator()
        }
    };

    DropdownEditor.prototype.hideLoadingIndicator = function () {
        if (this.isDisposed()) {
            return
        }

        if (!Modernizr.touch) {
            this.indicatorContainer.loadIndicator('hide');
            this.indicatorContainer.loadIndicator('destroy')
        }
    };

    DropdownEditor.prototype.optionsRequestDone = function (data, currentValue, initialization) {
        if (this.isDisposed()) {
            // Handle the case when the asynchronous request finishes after
            // the editor is disposed
            return
        }

        var select = this.getSelect();

        // Without destroying and recreating the custom select
        // there could be detached DOM nodes.
        this.destroyCustomSelect();
        this.clearOptions(select);
        this.initCustomSelect();

        this.createPlaceholder(select);

        if (data.options) {
            for (var i = 0, len = data.options.length; i < len; i++) {
                this.createOption(select, data.options[i].title, data.options[i].value)
            }
        }

        if (this.hasOptionValue(select, currentValue)) {
            select.value = currentValue
        }
        else {
            select.selectedIndex = this.propertyDefinition.placeholder === undefined ? 0 : -1
        }

        this.initialization = initialization;
        $(select).trigger('change');
        this.initialization = false
    };

    Storm.inspector.propertyEditors.dropdown = DropdownEditor
}(window.jQuery);
/*
 * Base class for Inspector editors that create popups.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.base,
        BaseProto = Base.prototype;

    var PopupBase = function (inspector, propertyDefinition, containerCell, group) {
        this.popup = null;

        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    PopupBase.prototype = Object.create(BaseProto);
    PopupBase.prototype.constructor = Base;

    PopupBase.prototype.dispose = function () {
        this.unregisterHandlers();
        this.popup = null;

        BaseProto.dispose.call(this)
    };

    PopupBase.prototype.build = function () {
        var link = document.createElement('a');

        Storm.foundation.element.addClass(link, 'trigger');
        link.setAttribute('href', '#');
        this.setLinkText(link);

        Storm.foundation.element.addClass(this.containerCell, 'trigger-cell');

        this.containerCell.appendChild(link)
    };

    PopupBase.prototype.setLinkText = function (link, value) {
    };

    PopupBase.prototype.getPopupContent = function () {
        return '<form>                                                                                  \
                <div class="modal-header">                                                              \
                    <button type="button" class="close" data-dismiss="popup">&times;</button>           \
                    <h4 class="modal-title">{{property}}</h4>                                           \
                </div>                                                                                  \
                <div class="modal-body">                                                                \
                    <div class="form-group">                                                            \
                    </div>                                                                              \
                </div>                                                                                  \
                <div class="modal-footer">                                                              \
                    <button type="submit" class="btn btn-primary">OK</button>                           \
                    <button type="button" class="btn btn-default" data-dismiss="popup">Cancel</button>  \
                </div>                                                                                  \
                </form>'
    };

    PopupBase.prototype.updateDisplayedValue = function (value) {
        this.setLinkText(this.getLink(), value)
    };

    PopupBase.prototype.registerHandlers = function () {
        var link = this.getLink(),
            $link = $(link);

        link.addEventListener('click', this.proxy(this.onTriggerClick));
        $link.on('shown.oc.popup', this.proxy(this.onPopupShown));
        $link.on('hidden.oc.popup', this.proxy(this.onPopupHidden))
    };

    PopupBase.prototype.unregisterHandlers = function () {
        var link = this.getLink(),
            $link = $(link);

        link.removeEventListener('click', this.proxy(this.onTriggerClick));
        $link.off('shown.oc.popup', this.proxy(this.onPopupShown));
        $link.off('hidden.oc.popup', this.proxy(this.onPopupHidden))
    };

    PopupBase.prototype.getLink = function () {
        return this.containerCell.querySelector('a.trigger')
    };

    PopupBase.prototype.configurePopup = function (popup) {
    };

    PopupBase.prototype.handleSubmit = function ($form) {
    };

    PopupBase.prototype.hidePopup = function () {
        $(this.getLink()).popup('hide')
    };

    PopupBase.prototype.onTriggerClick = function (ev) {
        Storm.foundation.event.stop(ev);

        var content = this.getPopupContent();

        content = content.replace('{{property}}', this.propertyDefinition.title);

        $(ev.target).popup({
            content: content
        });

        return false
    };

    PopupBase.prototype.onPopupShown = function (ev, link, popup) {
        $(popup).on('submit.inspector', 'form', this.proxy(this.onSubmit));

        this.popup = popup.get(0);

        this.configurePopup(popup);

        this.getRootSurface().popupDisplayed()
    };

    PopupBase.prototype.onPopupHidden = function (ev, link, popup) {
        $(popup).off('.inspector', 'form', this.proxy(this.onSubmit));
        this.popup = null;

        this.getRootSurface().popupHidden()
    };

    PopupBase.prototype.onSubmit = function (ev) {
        ev.preventDefault();

        if (this.handleSubmit($(ev.target)) === false) {
            return false
        }

        this.setLinkText(this.getLink());
        this.hidePopup();
        return false
    };

    Storm.inspector.propertyEditors.popupBase = PopupBase
}(window.jQuery);
/*
 * Inspector text editor class.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.popupBase,
        BaseProto = Base.prototype;

    var TextEditor = function (inspector, propertyDefinition, containerCell, group) {
        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    TextEditor.prototype = Object.create(BaseProto);
    TextEditor.prototype.constructor = Base;

    TextEditor.prototype.setLinkText = function (link, value) {
        var value = value !== undefined ? value
            : this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        if (!value) {
            value = this.propertyDefinition.placeholder;
            Storm.foundation.element.addClass(link, 'placeholder')
        }
        else {
            Storm.foundation.element.removeClass(link, 'placeholder')
        }

        if (typeof value === 'string') {
            value = value.replace(/(?:\r\n|\r|\n)/g, ' ');
            value = $.trim(value);
            value = value.substring(0, 300);
        }

        link.textContent = value
    };

    TextEditor.prototype.getPopupContent = function () {
        return '<form>                                                                                  \
                <div class="modal-header">                                                              \
                    <button type="button" class="close" data-dismiss="popup">&times;</button>           \
                    <h4 class="modal-title">{{property}}</h4>                                           \
                </div>                                                                                  \
                <div class="modal-body">                                                                \
                    <div class="form-group">                                                            \
                        <p class="inspector-field-comment"></p>                                         \
                        <textarea class="form-control size-small field-textarea" name="name"/> \
                    </div>                                                                              \
                </div>                                                                                  \
                <div class="modal-footer">                                                              \
                    <button type="submit" class="btn btn-primary">OK</button>                           \
                    <button type="button" class="btn btn-default" data-dismiss="popup">Cancel</button>  \
                </div>                                                                                  \
                </form>'
    };

    TextEditor.prototype.configureComment = function (popup) {
        if (!this.propertyDefinition.description) {
            return
        }

        var descriptionElement = $(popup).find('p.inspector-field-comment');
        descriptionElement.text(this.propertyDefinition.description)
    };

    TextEditor.prototype.configurePopup = function (popup) {
        var $textarea = $(popup).find('textarea'),
            value = this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (this.propertyDefinition.placeholder) {
            $textarea.attr('placeholder', this.propertyDefinition.placeholder)
        }

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        $textarea.val(value);
        $textarea.focus();

        this.configureComment(popup)
    };

    TextEditor.prototype.handleSubmit = function ($form) {
        var $textarea = $form.find('textarea'),
            link = this.getLink(),
            value = $.trim($textarea.val());

        this.inspector.setPropertyValue(this.propertyDefinition.property, value)
    };

    Storm.inspector.propertyEditors.text = TextEditor
}(window.jQuery);
/*
 * Inspector set editor class.
 *
 * This class uses Storm.inspector.propertyEditors.checkbox editor.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.base,
        BaseProto = Base.prototype;

    var SetEditor = function (inspector, propertyDefinition, containerCell, group) {
        this.editors = [];
        this.loadedItems = null;

        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    SetEditor.prototype = Object.create(BaseProto);
    SetEditor.prototype.constructor = Base;

    SetEditor.prototype.init = function () {
        this.initControlGroup();

        BaseProto.init.call(this)
    };

    SetEditor.prototype.dispose = function () {
        this.disposeEditors();
        this.disposeControls();

        this.editors = null;

        BaseProto.dispose.call(this)
    };

    //
    // Building
    //

    SetEditor.prototype.build = function () {
        var link = document.createElement('a');

        Storm.foundation.element.addClass(link, 'trigger');
        link.setAttribute('href', '#');
        this.setLinkText(link);

        Storm.foundation.element.addClass(this.containerCell, 'trigger-cell');

        this.containerCell.appendChild(link);

        if (this.propertyDefinition.items !== undefined) {
            this.loadStaticItems()
        }
        else {
            this.loadDynamicItems()
        }
    };

    SetEditor.prototype.loadStaticItems = function () {
        var itemArray = [];

        for (var itemValue in this.propertyDefinition.items) {
            itemArray.push({
                value: itemValue,
                title: this.propertyDefinition.items[itemValue]
            })
        }

        for (var i = itemArray.length - 1; i >= 0; i--) {
            this.buildItemEditor(itemArray[i].value, itemArray[i].title)
        }
    };

    SetEditor.prototype.setLinkText = function (link, value) {
        var value = (value !== undefined && value !== null) ? value
                : this.getNormalizedValue(),
            text = '[ ]';

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        if (value !== undefined && value.length !== undefined && value.length > 0 && typeof value !== 'string') {
            var textValues = [];
            for (var i = 0, len = value.length; i < len; i++) {
                textValues.push(this.valueToText(value[i]))
            }

            text = '[' + textValues.join(', ') + ']';
            Storm.foundation.element.removeClass(link, 'placeholder')
        }
        else {
            text = this.propertyDefinition.placeholder;

            if ((typeof text === 'string' && text.length == 0) || text === undefined) {
                text = '[ ]'
            }
            Storm.foundation.element.addClass(link, 'placeholder')
        }

        link.textContent = text
    };

    SetEditor.prototype.buildItemEditor = function (value, text) {
        var property = {
                title: text,
                itemType: 'property',
                groupIndex: this.group.getGroupIndex()
            },
            newRow = this.createGroupedRow(property),
            currentRow = this.containerCell.parentNode,
            tbody = this.containerCell.parentNode.parentNode, // row / tbody
            cell = document.createElement('td');

        this.buildCheckbox(cell, value, text);

        newRow.appendChild(cell);
        tbody.insertBefore(newRow, currentRow.nextSibling)
    };

    SetEditor.prototype.buildCheckbox = function (cell, value, title) {
        var property = {
                property: value,
                title: title,
                default: this.isCheckedByDefault(value)
            },
            editor = new Storm.inspector.propertyEditors.checkbox(this, property, cell, this.group);

        this.editors.push(editor);
    };

    SetEditor.prototype.isCheckedByDefault = function (value) {
        if (!this.propertyDefinition.default) {
            return false
        }

        return this.propertyDefinition.default.indexOf(value) > -1
    };

    //
    // Dynamic items
    //

    SetEditor.prototype.showLoadingIndicator = function () {
        $(this.getLink()).loadIndicator()
    };

    SetEditor.prototype.hideLoadingIndicator = function () {
        if (this.isDisposed()) {
            return
        }

        var $link = $(this.getLink());

        $link.loadIndicator('hide');
        $link.loadIndicator('destroy')
    };

    SetEditor.prototype.loadDynamicItems = function () {
        var link = this.getLink(),
            data = this.inspector.getValues(),
            $form = $(link).closest('form');

        Storm.foundation.element.addClass(link, 'loading-indicator-container size-small');
        this.showLoadingIndicator();

        data['inspectorProperty'] = this.getPropertyPath();
        data['inspectorClassName'] = this.inspector.options.inspectorClass;

        $form.request('onInspectableGetOptions', {
            data: data,
        })
            .done(this.proxy(this.itemsRequestDone))
            .always(this.proxy(this.hideLoadingIndicator))
    };

    SetEditor.prototype.itemsRequestDone = function (data, currentValue, initialization) {
        if (this.isDisposed()) {
            // Handle the case when the asynchronous request finishes after
            // the editor is disposed
            return
        }

        this.loadedItems = {};

        if (data.options) {
            for (var i = data.options.length - 1; i >= 0; i--) {
                this.buildItemEditor(data.options[i].value, data.options[i].title);

                this.loadedItems[data.options[i].value] = data.options[i].title
            }
        }

        this.setLinkText(this.getLink())
    };

    //
    // Helpers
    //

    SetEditor.prototype.getLink = function () {
        return this.containerCell.querySelector('a.trigger')
    };

    SetEditor.prototype.getItemsSource = function () {
        if (this.propertyDefinition.items !== undefined) {
            return this.propertyDefinition.items
        }

        return this.loadedItems
    };

    SetEditor.prototype.valueToText = function (value) {
        var source = this.getItemsSource();

        if (!source) {
            return value
        }

        for (var itemValue in source) {
            if (itemValue == value) {
                return source[itemValue]
            }
        }

        return value
    };

    /* 
     * Removes items that don't exist in the defined items from
     * the value.
     */
    SetEditor.prototype.cleanUpValue = function (value) {
        if (!value) {
            return value
        }

        var result = [],
            source = this.getItemsSource();

        for (var i = 0, len = value.length; i < len; i++) {
            var currentValue = value[i];

            if (source[currentValue] !== undefined) {
                result.push(currentValue)
            }
        }

        return result
    };

    SetEditor.prototype.getNormalizedValue = function () {
        var value = this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (value === null) {
            value = undefined
        }

        if (value === undefined) {
            return value
        }

        if (value.length === undefined || typeof value === 'string') {
            return undefined
        }

        return value
    };

    //
    // Editor API methods
    //

    SetEditor.prototype.supportsExternalParameterEditor = function () {
        return false
    };

    SetEditor.prototype.isGroupedEditor = function () {
        return true
    };

    //
    // Inspector API methods
    //
    // This editor creates checkbox editor and acts as a container Inspector
    // for them. The methods in this section emulate and proxy some functionality
    // of the Inspector.
    //

    SetEditor.prototype.getPropertyValue = function (checkboxValue) {
        // When a checkbox requests the property value, we return
        // TRUE if the checkbox value is listed in the current values of
        // the set.
        // For example, the available set items are [create, update], the 
        // current set value is [create] and checkboxValue is "create".
        // The result of the method will be TRUE.

        var value = this.getNormalizedValue();

        if (value === undefined) {
            return this.isCheckedByDefault(checkboxValue)
        }

        if (!value) {
            return false
        }

        return value.indexOf(checkboxValue) > -1
    };

    SetEditor.prototype.setPropertyValue = function (checkboxValue, isChecked) {
        // In this method the Set Editor mimics the Surface.
        // It acts as a parent surface for the children checkboxes,
        // watching changes in them and updating the link text.

        var currentValue = this.getNormalizedValue();

        if (currentValue === undefined) {
            currentValue = this.propertyDefinition.default
        }

        if (!currentValue) {
            currentValue = []
        }

        var resultValue = [],
            items = this.getItemsSource();

        for (var itemValue in items) {
            if (itemValue !== checkboxValue) {
                if (currentValue.indexOf(itemValue) !== -1) {
                    resultValue.push(itemValue)
                }
            }
            else {
                if (isChecked) {
                    resultValue.push(itemValue)
                }
            }
        }

        this.inspector.setPropertyValue(this.propertyDefinition.property, this.cleanUpValue(resultValue));
        this.setLinkText(this.getLink())
    };

    SetEditor.prototype.generateSequencedId = function () {
        return this.inspector.generateSequencedId()
    };

    //
    // Disposing
    //

    SetEditor.prototype.disposeEditors = function () {
        for (var i = 0, len = this.editors.length; i < len; i++) {
            var editor = this.editors[i];

            editor.dispose()
        }
    };

    SetEditor.prototype.disposeControls = function () {
        var link = this.getLink();

        if (this.propertyDefinition.items === undefined) {
            $(link).loadIndicator('destroy')
        }

        link.parentNode.removeChild(link)
    };

    Storm.inspector.propertyEditors.set = SetEditor
}(window.jQuery);
/*
 * Inspector object list editor class.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.base,
        BaseProto = Base.prototype;

    var ObjectListEditor = function (inspector, propertyDefinition, containerCell, group) {
        this.currentRowInspector = null;
        this.popup = null;

        if (propertyDefinition.titleProperty === undefined) {
            throw new Error('The titleProperty property should be specified in the objectList editor configuration. Property: ' + propertyDefinition.property)
        }

        if (propertyDefinition.itemProperties === undefined) {
            throw new Error('The itemProperties property should be specified in the objectList editor configuration. Property: ' + propertyDefinition.property)
        }

        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    ObjectListEditor.prototype = Object.create(BaseProto);
    ObjectListEditor.prototype.constructor = Base;

    ObjectListEditor.prototype.init = function () {
        if (this.isKeyValueMode()) {
            var keyProperty = this.getKeyProperty();

            if (!keyProperty) {
                throw new Error('Object list key property ' + this.propertyDefinition.keyProperty
                    + ' is not defined in itemProperties. Property: ' + this.propertyDefinition.property)
            }
        }

        BaseProto.init.call(this)
    };

    ObjectListEditor.prototype.dispose = function () {
        this.unregisterHandlers();
        this.removeControls();

        this.currentRowInspector = null;
        this.popup = null;

        BaseProto.dispose.call(this)
    };

    ObjectListEditor.prototype.supportsExternalParameterEditor = function () {
        return false
    };

    //
    // Building
    //

    ObjectListEditor.prototype.build = function () {
        var link = document.createElement('a');

        Storm.foundation.element.addClass(link, 'trigger');
        link.setAttribute('href', '#');
        this.setLinkText(link);

        Storm.foundation.element.addClass(this.containerCell, 'trigger-cell');

        this.containerCell.appendChild(link)
    };

    ObjectListEditor.prototype.setLinkText = function (link, value) {
        var value = value !== undefined && value !== null ? value
            : this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (value === null) {
            value = undefined
        }

        if (value === undefined) {
            var placeholder = this.propertyDefinition.placeholder;

            if (placeholder !== undefined) {
                Storm.foundation.element.addClass(link, 'placeholder');
                link.textContent = placeholder
            }
            else {
                link.textContent = 'Items: 0'
            }
        }
        else {
            var itemCount = 0;

            if (!this.isKeyValueMode()) {
                if (value.length === undefined) {
                    throw new Error('Object list value should be an array. Property: ' + this.propertyDefinition.property)
                }

                itemCount = value.length
            }
            else {
                if (typeof value !== 'object') {
                    throw new Error('Object list value should be an object. Property: ' + this.propertyDefinition.property)
                }

                itemCount = this.getValueKeys(value).length
            }

            Storm.foundation.element.removeClass(link, 'placeholder');
            link.textContent = 'Items: ' + itemCount
        }
    };

    ObjectListEditor.prototype.getPopupContent = function () {
        return '<form>                                                                                  \
                <div class="modal-header">                                                              \
                    <button type="button" class="close" data-dismiss="popup">&times;</button>           \
                    <h4 class="modal-title">{{property}}</h4>                                           \
                </div>                                                                                  \
                <div>                                                                                   \
                    <div class="layout inspector-columns-editor">                                       \
                        <div class="layout-row">                                                        \
                            <div class="layout-cell items-column">                                      \
                                <div class="layout-relative">                                           \
                                    <div class="layout">                                                \
                                        <div class="layout-row min-size">                               \
                                            <div class="control-toolbar toolbar-padded">                \
                                                <div class="toolbar-item">                              \
                                                    <div class="btn-group">                             \
                                                        <button type="button" class="btn btn-primary    \
                                                            oc-icon-plus"                               \
                                                            data-cmd="create-item">Add</button>         \
                                                        <button type="button" class="btn btn-default    \
                                                            empty oc-icon-trash-o"                      \
                                                            data-cmd="delete-item"></button>            \
                                                    </div>                                              \
                                                </div>                                                  \
                                            </div>                                                      \
                                        </div>                                                          \
                                        <div class="layout-row">                                        \
                                            <div class="layout-cell">                                   \
                                                <div class="layout-relative">                           \
                                                    <div class="layout-absolute">                       \
                                                        <div class="control-scrollpad"                  \
                                                            data-control="scrollpad">                   \
                                                            <div class="scroll-wrapper">                \
                                                                <table class="table data                \
                                                                    no-offset-bottom                    \
                                                                    inspector-table-list">              \
                                                                </table>                                \
                                                            </div>                                      \
                                                        </div>                                          \
                                                    </div>                                              \
                                                </div>                                                  \
                                            </div>                                                      \
                                        </div>                                                          \
                                    </div>                                                              \
                                </div>                                                                  \
                            </div>                                                                      \
                            <div class="layout-cell">                                                   \
                                <div class="layout-relative">                                           \
                                    <div class="layout-absolute">                                       \
                                        <div class="control-scrollpad" data-control="scrollpad">        \
                                            <div class="scroll-wrapper inspector-wrapper">              \
                                                <div data-inspector-container>                          \
                                                </div>                                                  \
                                            </div>                                                      \
                                        </div>                                                          \
                                    </div>                                                              \
                                </div>                                                                  \
                            </div>                                                                      \
                        </div>                                                                          \
                    </div>                                                                              \
                </div>                                                                                  \
                <div class="modal-footer">                                                              \
                    <button type="submit" class="btn btn-primary">OK</button>                           \
                    <button type="button" class="btn btn-default" data-dismiss="popup">Cancel</button>  \
                </div>                                                                                  \
                </form>'
    };

    ObjectListEditor.prototype.buildPopupContents = function (popup) {
        this.buildItemsTable(popup)
    };

    ObjectListEditor.prototype.buildItemsTable = function (popup) {
        var table = popup.querySelector('table'),
            tbody = document.createElement('tbody'),
            items = this.inspector.getPropertyValue(this.propertyDefinition.property),
            titleProperty = this.propertyDefinition.titleProperty;

        if (items === undefined || this.getValueKeys(items).length === 0) {
            var row = this.buildEmptyRow();

            tbody.appendChild(row)
        }
        else {
            var firstRow = undefined;

            for (var key in items) {
                var item = items[key],
                    itemInspectorValue = this.addKeyProperty(key, item),
                    itemText = item[titleProperty],
                    row = this.buildTableRow(itemText, 'rowlink');

                row.setAttribute('data-inspector-values', JSON.stringify(itemInspectorValue));
                tbody.appendChild(row);

                if (firstRow === undefined) {
                    firstRow = row
                }
            }
        }

        table.appendChild(tbody);

        if (firstRow !== undefined) {
            this.selectRow(firstRow, true)
        }

        this.updateScrollpads()
    };

    ObjectListEditor.prototype.buildEmptyRow = function () {
        return this.buildTableRow('No items found', 'no-data', 'nolink')
    };

    ObjectListEditor.prototype.removeEmptyRow = function () {
        var tbody = this.getTableBody(),
            row = tbody.querySelector('tr.no-data');

        if (row) {
            tbody.removeChild(row)
        }
    };

    ObjectListEditor.prototype.buildTableRow = function (text, rowClass, cellClass) {
        var row = document.createElement('tr'),
            cell = document.createElement('td');

        cell.textContent = text;

        if (rowClass !== undefined) {
            Storm.foundation.element.addClass(row, rowClass)
        }

        if (cellClass !== undefined) {
            Storm.foundation.element.addClass(cell, cellClass)
        }

        row.appendChild(cell);
        return row
    };

    ObjectListEditor.prototype.updateScrollpads = function () {
        $('.control-scrollpad', this.popup).scrollpad('update')
    };

    //
    // Built-in Inspector management
    //

    ObjectListEditor.prototype.selectRow = function (row, forceSelect) {
        var tbody = row.parentNode,
            inspectorContainer = this.getInspectorContainer(),
            selectedRow = this.getSelectedRow();

        if (selectedRow === row && !forceSelect) {
            return
        }

        if (selectedRow) {
            if (!this.validateKeyValue()) {
                return
            }

            if (this.currentRowInspector) {
                if (!this.currentRowInspector.validate()) {
                    return
                }
            }

            this.applyDataToRow(selectedRow);
            Storm.foundation.element.removeClass(selectedRow, 'active')
        }

        this.disposeInspector();

        Storm.foundation.element.addClass(row, 'active');

        this.createInspectorForRow(row, inspectorContainer)
    };

    ObjectListEditor.prototype.createInspectorForRow = function (row, inspectorContainer) {
        var dataStr = row.getAttribute('data-inspector-values');

        if (dataStr === undefined || typeof dataStr !== 'string') {
            throw new Error('Values not found for the selected row.')
        }

        var properties = this.propertyDefinition.itemProperties,
            values = $.parseJSON(dataStr),
            options = {
                enableExternalParameterEditor: false,
                onChange: this.proxy(this.onInspectorDataChange),
                inspectorClass: this.inspector.options.inspectorClass
            };

        this.currentRowInspector = new Storm.inspector.surface(inspectorContainer, properties, values,
            Storm.inspector.helpers.generateElementUniqueId(inspectorContainer), options)
    };

    ObjectListEditor.prototype.disposeInspector = function () {
        Storm.foundation.controlUtils.disposeControls(this.popup.querySelector('[data-inspector-container]'));
        this.currentRowInspector = null
    };

    ObjectListEditor.prototype.applyDataToRow = function (row) {
        if (this.currentRowInspector === null) {
            return
        }

        var data = this.currentRowInspector.getValues();
        row.setAttribute('data-inspector-values', JSON.stringify(data))
    };

    ObjectListEditor.prototype.updateRowText = function (property, value) {
        var selectedRow = this.getSelectedRow();

        if (!selectedRow) {
            throw new Exception('A row is not found for the updated data')
        }

        if (property !== this.propertyDefinition.titleProperty) {
            return
        }

        value = $.trim(value);

        if (value.length === 0) {
            value = '[No title]';
            Storm.foundation.element.addClass(selectedRow, 'disabled')
        }
        else {
            Storm.foundation.element.removeClass(selectedRow, 'disabled')
        }

        selectedRow.firstChild.textContent = value
    };

    ObjectListEditor.prototype.getSelectedRow = function () {
        if (!this.popup) {
            throw new Error('Trying to get selected row without a popup reference.')
        }

        var rows = this.getTableBody().children;

        for (var i = 0, len = rows.length; i < len; i++) {
            if (Storm.foundation.element.hasClass(rows[i], 'active')) {
                return rows[i]
            }
        }

        return null
    };

    ObjectListEditor.prototype.createItem = function () {
        var selectedRow = this.getSelectedRow();

        if (selectedRow) {
            if (!this.validateKeyValue()) {
                return
            }

            if (this.currentRowInspector) {
                if (!this.currentRowInspector.validate()) {
                    return
                }
            }

            this.applyDataToRow(selectedRow);
            Storm.foundation.element.removeClass(selectedRow, 'active')
        }

        this.disposeInspector();

        var title = 'New item',
            row = this.buildTableRow(title, 'rowlink active'),
            tbody = this.getTableBody(),
            data = {};

        data[this.propertyDefinition.titleProperty] = title;

        row.setAttribute('data-inspector-values', JSON.stringify(data));
        tbody.appendChild(row);

        this.selectRow(row, true);

        this.removeEmptyRow();
        this.updateScrollpads()
    };

    ObjectListEditor.prototype.deleteItem = function () {
        var selectedRow = this.getSelectedRow();

        if (!selectedRow) {
            return
        }

        var nextRow = selectedRow.nextElementSibling,
            prevRow = selectedRow.previousElementSibling,
            tbody = this.getTableBody();

        this.disposeInspector();
        tbody.removeChild(selectedRow);

        var newSelectedRow = nextRow ? nextRow : prevRow;

        if (newSelectedRow) {
            this.selectRow(newSelectedRow)
        }
        else {
            tbody.appendChild(this.buildEmptyRow())
        }

        this.updateScrollpads()
    };

    ObjectListEditor.prototype.applyDataToParentInspector = function () {
        var selectedRow = this.getSelectedRow(),
            tbody = this.getTableBody(),
            dataRows = tbody.querySelectorAll('tr[data-inspector-values]'),
            link = this.getLink(),
            result = this.getEmptyValue();

        if (selectedRow) {
            if (!this.validateKeyValue()) {
                return
            }

            if (this.currentRowInspector) {
                if (!this.currentRowInspector.validate()) {
                    return
                }
            }

            this.applyDataToRow(selectedRow)
        }

        for (var i = 0, len = dataRows.length; i < len; i++) {
            var dataRow = dataRows[i],
                rowData = $.parseJSON(dataRow.getAttribute('data-inspector-values'));

            if (!this.isKeyValueMode()) {
                result.push(rowData)
            }
            else {
                var rowKey = rowData[this.propertyDefinition.keyProperty];

                result[rowKey] = this.removeKeyProperty(rowData)
            }
        }

        this.inspector.setPropertyValue(this.propertyDefinition.property, result);
        this.setLinkText(link, result);

        $(link).popup('hide');
        return false
    };

    ObjectListEditor.prototype.validateKeyValue = function () {
        if (!this.isKeyValueMode()) {
            return true
        }

        if (this.currentRowInspector === null) {
            return true
        }

        var data = this.currentRowInspector.getValues(),
            keyProperty = this.propertyDefinition.keyProperty;

        if (data[keyProperty] === undefined) {
            throw new Error('Key property ' + keyProperty + ' is not found in the Inspector data. Property: ' + this.propertyDefinition.property)
        }

        var keyPropertyValue = data[keyProperty],
            keyPropertyTitle = this.getKeyProperty().title;

        if (typeof keyPropertyValue !== 'string') {
            throw new Error('Key property (' + keyProperty + ') value should be a string. Property: ' + this.propertyDefinition.property)
        }

        if ($.trim(keyPropertyValue).length === 0) {
            Storm.flashMsg({
                text: 'The value of key property ' + keyPropertyTitle + ' cannot be empty.',
                'class': 'error',
                'interval': 3
            });
            return false
        }

        var selectedRow = this.getSelectedRow(),
            tbody = this.getTableBody(),
            dataRows = tbody.querySelectorAll('tr[data-inspector-values]');

        for (var i = 0, len = dataRows.length; i < len; i++) {
            var dataRow = dataRows[i],
                rowData = $.parseJSON(dataRow.getAttribute('data-inspector-values'));

            if (selectedRow == dataRow) {
                continue
            }

            if (rowData[keyProperty] == keyPropertyValue) {
                Storm.flashMsg({
                    text: 'The value of key property ' + keyPropertyTitle + ' should be unique.',
                    'class': 'error',
                    'interval': 3
                });
                return false
            }
        }

        return true
    };

    //
    // Helpers
    //

    ObjectListEditor.prototype.getLink = function () {
        return this.containerCell.querySelector('a.trigger')
    };

    ObjectListEditor.prototype.getPopupFormElement = function () {
        var form = this.popup.querySelector('form');

        if (!form) {
            this.throwError('Cannot find form element in the popup window.')
        }

        return form
    };

    ObjectListEditor.prototype.getInspectorContainer = function () {
        return this.popup.querySelector('div[data-inspector-container]')
    };

    ObjectListEditor.prototype.getTableBody = function () {
        return this.popup.querySelector('table.inspector-table-list tbody')
    };

    ObjectListEditor.prototype.isKeyValueMode = function () {
        return this.propertyDefinition.keyProperty !== undefined
    };

    ObjectListEditor.prototype.getKeyProperty = function () {
        for (var i = 0, len = this.propertyDefinition.itemProperties.length; i < len; i++) {
            var property = this.propertyDefinition.itemProperties[i];

            if (property.property == this.propertyDefinition.keyProperty) {
                return property
            }
        }
    };

    ObjectListEditor.prototype.getValueKeys = function (value) {
        var result = [];

        for (var key in value) {
            result.push(key)
        }

        return result
    };

    ObjectListEditor.prototype.addKeyProperty = function (key, value) {
        if (!this.isKeyValueMode()) {
            return value
        }

        value[this.propertyDefinition.keyProperty] = key;

        return value
    };

    ObjectListEditor.prototype.removeKeyProperty = function (value) {
        if (!this.isKeyValueMode()) {
            return value
        }

        var result = value;

        if (result[this.propertyDefinition.keyProperty] !== undefined) {
            delete result[this.propertyDefinition.keyProperty]
        }

        return result
    };

    ObjectListEditor.prototype.getEmptyValue = function () {
        if (this.isKeyValueMode()) {
            return {}
        }
        else {
            return []
        }
    };

    //
    // Event handlers
    //

    ObjectListEditor.prototype.registerHandlers = function () {
        var link = this.getLink(),
            $link = $(link);

        link.addEventListener('click', this.proxy(this.onTriggerClick));
        $link.on('shown.oc.popup', this.proxy(this.onPopupShown));
        $link.on('hidden.oc.popup', this.proxy(this.onPopupHidden))
    };

    ObjectListEditor.prototype.unregisterHandlers = function () {
        var link = this.getLink(),
            $link = $(link);

        link.removeEventListener('click', this.proxy(this.onTriggerClick));
        $link.off('shown.oc.popup', this.proxy(this.onPopupShown));
        $link.off('hidden.oc.popup', this.proxy(this.onPopupHidden))
    };

    ObjectListEditor.prototype.onTriggerClick = function (ev) {
        Storm.foundation.event.stop(ev);

        var content = this.getPopupContent();

        content = content.replace('{{property}}', this.propertyDefinition.title);

        $(ev.target).popup({
            content: content
        });

        return false
    };

    ObjectListEditor.prototype.onPopupShown = function (ev, link, popup) {
        $(popup).on('submit.inspector', 'form', this.proxy(this.onSubmit));
        $(popup).on('click', 'tr.rowlink', this.proxy(this.onRowClick));
        $(popup).on('click.inspector', '[data-cmd]', this.proxy(this.onCommand));

        this.popup = popup.get(0);

        this.buildPopupContents(this.popup);
        this.getRootSurface().popupDisplayed()
    };

    ObjectListEditor.prototype.onPopupHidden = function (ev, link, popup) {
        $(popup).off('.inspector', this.proxy(this.onSubmit));
        $(popup).off('click', 'tr.rowlink', this.proxy(this.onRowClick));
        $(popup).off('click.inspector', '[data-cmd]', this.proxy(this.onCommand));

        this.disposeInspector();
        Storm.foundation.controlUtils.disposeControls(this.popup);

        this.popup = null;
        this.getRootSurface().popupHidden()
    };

    ObjectListEditor.prototype.onSubmit = function (ev) {
        this.applyDataToParentInspector();

        ev.preventDefault();
        return false
    };

    ObjectListEditor.prototype.onRowClick = function (ev) {
        this.selectRow(ev.currentTarget)
    };

    ObjectListEditor.prototype.onInspectorDataChange = function (property, value) {
        this.updateRowText(property, value)
    };

    ObjectListEditor.prototype.onCommand = function (ev) {
        var command = ev.currentTarget.getAttribute('data-cmd');

        switch (command) {
            case 'create-item' :
                this.createItem();
                break;
            case 'delete-item' :
                this.deleteItem();
                break;
        }
    };

    //
    // Disposing
    //

    ObjectListEditor.prototype.removeControls = function () {
        if (this.popup) {
            this.disposeInspector(this.popup)
        }
    };

    Storm.inspector.propertyEditors.objectList = ObjectListEditor
}(window.jQuery);
/*
 * Inspector object editor class.
 *
 * This class uses other editors.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.base,
        BaseProto = Base.prototype;

    var ObjectEditor = function (inspector, propertyDefinition, containerCell, group) {
        if (propertyDefinition.properties === undefined) {
            this.throwError('The properties property should be specified in the object editor configuration.')
        }

        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    ObjectEditor.prototype = Object.create(BaseProto);
    ObjectEditor.prototype.constructor = Base;

    ObjectEditor.prototype.init = function () {
        this.initControlGroup();

        BaseProto.init.call(this)
    };

    //
    // Building
    //

    ObjectEditor.prototype.build = function () {
        var currentRow = this.containerCell.parentNode,
            inspectorContainer = document.createElement('div'),
            options = {
                enableExternalParameterEditor: false,
                onChange: this.proxy(this.onInspectorDataChange),
                inspectorClass: this.inspector.options.inspectorClass
            },
            values = this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (values === undefined) {
            values = {}
        }

        this.childInspector = new Storm.inspector.surface(inspectorContainer,
            this.propertyDefinition.properties,
            values,
            this.inspector.getInspectorUniqueId() + '-' + this.propertyDefinition.property,
            options,
            this.inspector,
            this.group,
            this.propertyDefinition.property);

        this.inspector.mergeChildSurface(this.childInspector, currentRow)
    };

    //
    // Helpers
    //

    ObjectEditor.prototype.cleanUpValue = function (value) {
        if (value === undefined || typeof value !== 'object') {
            return undefined
        }

        if (this.propertyDefinition.ignoreIfPropertyEmpty === undefined) {
            return value
        }

        return this.getValueOrRemove(value)
    };

    ObjectEditor.prototype.getValueOrRemove = function (value) {
        if (this.propertyDefinition.ignoreIfPropertyEmpty === undefined) {
            return value
        }

        var targetProperty = this.propertyDefinition.ignoreIfPropertyEmpty,
            targetValue = value[targetProperty];

        if (this.isEmptyValue(targetValue)) {
            return Storm.inspector.removedProperty
        }

        return value
    };

    //
    // Editor API methods
    //

    ObjectEditor.prototype.supportsExternalParameterEditor = function () {
        return false
    };

    ObjectEditor.prototype.isGroupedEditor = function () {
        return true
    };

    ObjectEditor.prototype.getUndefinedValue = function () {
        var result = {};

        for (var i = 0, len = this.propertyDefinition.properties.length; i < len; i++) {
            var propertyName = this.propertyDefinition.properties[i].property,
                editor = this.childInspector.findPropertyEditor(propertyName);

            if (editor) {
                result[propertyName] = editor.getUndefinedValue()
            }
        }

        return this.getValueOrRemove(result)
    };

    ObjectEditor.prototype.validate = function (silentMode) {
        var values = this.childInspector.getValues();

        if (this.cleanUpValue(values) === Storm.inspector.removedProperty) {
            // Ignore any validation rules if the object's required 
            // property is empty (ignoreIfPropertyEmpty)

            return true
        }

        return this.childInspector.validate(silentMode)
    };

    //
    // Event handlers
    //

    ObjectEditor.prototype.onInspectorDataChange = function (property, value) {
        var values = this.childInspector.getValues();

        this.inspector.setPropertyValue(this.propertyDefinition.property, this.cleanUpValue(values))
    };

    Storm.inspector.propertyEditors.object = ObjectEditor
}(window.jQuery);
/*
 * Inspector string list editor class.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.text,
        BaseProto = Base.prototype;

    var StringListEditor = function (inspector, propertyDefinition, containerCell, group) {
        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    StringListEditor.prototype = Object.create(BaseProto);
    StringListEditor.prototype.constructor = Base;

    StringListEditor.prototype.setLinkText = function (link, value) {
        var value = value !== undefined ? value
            : this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        this.checkValueType(value);

        if (!value) {
            value = this.propertyDefinition.placeholder;
            Storm.foundation.element.addClass(link, 'placeholder');

            if (!value) {
                value = '[]'
            }

            link.textContent = value
        }
        else {
            Storm.foundation.element.removeClass(link, 'placeholder');

            link.textContent = '[' + value.join(', ') + ']'
        }
    };

    StringListEditor.prototype.checkValueType = function (value) {
        if (value && Object.prototype.toString.call(value) !== '[object Array]') {
            this.throwError('The string list value should be an array.')
        }
    };

    StringListEditor.prototype.configurePopup = function (popup) {
        var $textarea = $(popup).find('textarea'),
            value = this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (this.propertyDefinition.placeholder) {
            $textarea.attr('placeholder', this.propertyDefinition.placeholder)
        }

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        this.checkValueType(value);

        if (value && value.length) {
            $textarea.val(value.join('\n'))
        }

        $textarea.focus();

        this.configureComment(popup)
    };

    StringListEditor.prototype.handleSubmit = function ($form) {
        var $textarea = $form.find('textarea'),
            link = this.getLink(),
            value = $.trim($textarea.val()),
            arrayValue = [],
            resultValue = [];

        if (value.length) {
            value = value.replace(/\r\n/g, '\n');
            arrayValue = value.split('\n');

            for (var i = 0, len = arrayValue.length; i < len; i++) {
                var currentValue = $.trim(arrayValue[i]);

                if (currentValue.length > 0) {
                    resultValue.push(currentValue)
                }
            }
        }

        this.inspector.setPropertyValue(this.propertyDefinition.property, resultValue)
    };

    Storm.inspector.propertyEditors.stringList = StringListEditor
}(window.jQuery);
/*
 * Inspector string list with autocompletion editor class.
 *
 * TODO: validation is not implemented in this editor. See the Dictionary editor for reference.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.popupBase,
        BaseProto = Base.prototype;

    var StringListAutocomplete = function (inspector, propertyDefinition, containerCell, group) {
        this.items = null;

        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    StringListAutocomplete.prototype = Object.create(BaseProto);
    StringListAutocomplete.prototype.constructor = Base;

    StringListAutocomplete.prototype.dispose = function () {
        BaseProto.dispose.call(this)
    };

    StringListAutocomplete.prototype.init = function () {
        BaseProto.init.call(this)
    };

    StringListAutocomplete.prototype.supportsExternalParameterEditor = function () {
        return false
    };

    StringListAutocomplete.prototype.setLinkText = function (link, value) {
        var value = value !== undefined ? value
            : this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        this.checkValueType(value);

        if (!value) {
            value = this.propertyDefinition.placeholder;
            Storm.foundation.element.addClass(link, 'placeholder');

            if (!value) {
                value = '[]'
            }

            link.textContent = value
        }
        else {
            Storm.foundation.element.removeClass(link, 'placeholder');

            link.textContent = '[' + value.join(', ') + ']'
        }
    };

    StringListAutocomplete.prototype.checkValueType = function (value) {
        if (value && Object.prototype.toString.call(value) !== '[object Array]') {
            this.throwError('The string list value should be an array.')
        }
    };

    //
    // Popup editor methods
    //

    StringListAutocomplete.prototype.getPopupContent = function () {
        return '<form>                                                                                  \
                <div class="modal-header">                                                              \
                    <button type="button" class="close" data-dismiss="popup">&times;</button>           \
                    <h4 class="modal-title">{{property}}</h4>                                           \
                </div>                                                                                  \
                <div class="modal-body">                                                                \
                    <div class="control-toolbar">                                                       \
                        <div class="toolbar-item">                                                      \
                            <div class="btn-group">                                                     \
                                <button type="button" class="btn btn-primary                            \
                                    oc-icon-plus"                                                       \
                                    data-cmd="create-item">Add</button>                                 \
                                <button type="button" class="btn btn-default                            \
                                    empty oc-icon-trash-o"                                              \
                                    data-cmd="delete-item"></button>                                    \
                            </div>                                                                      \
                        </div>                                                                          \
                    </div>                                                                              \
                    <div class="form-group">                                                            \
                        <div class="inspector-dictionary-container">                                    \
                            <div class="values">                                                        \
                                <div class="control-scrollpad"                                          \
                                    data-control="scrollpad">                                           \
                                    <div class="scroll-wrapper">                                        \
                                        <table class="                                                  \
                                            no-offset-bottom                                            \
                                            inspector-dictionary-table">                                \
                                        </table>                                                        \
                                    </div>                                                              \
                                </div>                                                                  \
                            </div>                                                                      \
                        </div>                                                                          \
                    </div>                                                                              \
                </div>                                                                                  \
                <div class="modal-footer">                                                              \
                    <button type="submit" class="btn btn-primary">OK</button>                           \
                    <button type="button" class="btn btn-default" data-dismiss="popup">Cancel</button>   \
                </div>                                                                                  \
                </form>'
    };

    StringListAutocomplete.prototype.configurePopup = function (popup) {
        this.initAutocomplete();

        this.buildItemsTable(popup.get(0));

        this.focusFirstInput()
    };

    StringListAutocomplete.prototype.handleSubmit = function ($form) {
        return this.applyValues()
    };

    //
    // Building and row management
    //

    StringListAutocomplete.prototype.buildItemsTable = function (popup) {
        var table = popup.querySelector('table.inspector-dictionary-table'),
            tbody = document.createElement('tbody'),
            items = this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (items === undefined) {
            items = this.propertyDefinition.default
        }

        if (items === undefined || this.getValueKeys(items).length === 0) {
            var row = this.buildEmptyRow();

            tbody.appendChild(row)
        }
        else {
            for (var key in items) {
                var row = this.buildTableRow(items[key]);

                tbody.appendChild(row)
            }
        }

        table.appendChild(tbody);
        this.updateScrollpads()
    };

    StringListAutocomplete.prototype.buildTableRow = function (value) {
        var row = document.createElement('tr'),
            valueCell = document.createElement('td');

        this.createInput(valueCell, value);

        row.appendChild(valueCell);

        return row
    };

    StringListAutocomplete.prototype.buildEmptyRow = function () {
        return this.buildTableRow(null)
    };

    StringListAutocomplete.prototype.createInput = function (container, value) {
        var input = document.createElement('input'),
            controlContainer = document.createElement('div');

        input.setAttribute('type', 'text');
        input.setAttribute('class', 'form-control');
        input.value = value;

        controlContainer.appendChild(input);
        container.appendChild(controlContainer)
    };

    StringListAutocomplete.prototype.setActiveCell = function (input) {
        var activeCells = this.popup.querySelectorAll('td.active');

        for (var i = activeCells.length - 1; i >= 0; i--) {
            Storm.foundation.element.removeClass(activeCells[i], 'active')
        }

        var activeCell = input.parentNode.parentNode; // input / div / td
        Storm.foundation.element.addClass(activeCell, 'active');

        this.buildAutoComplete(input)
    };

    StringListAutocomplete.prototype.createItem = function () {
        var activeRow = this.getActiveRow(),
            newRow = this.buildEmptyRow(),
            tbody = this.getTableBody(),
            nextSibling = activeRow ? activeRow.nextElementSibling : null;

        tbody.insertBefore(newRow, nextSibling);

        this.focusAndMakeActive(newRow.querySelector('input'));
        this.updateScrollpads()
    };

    StringListAutocomplete.prototype.deleteItem = function () {
        var activeRow = this.getActiveRow(),
            tbody = this.getTableBody();

        if (!activeRow) {
            return
        }

        var nextRow = activeRow.nextElementSibling,
            prevRow = activeRow.previousElementSibling,
            input = this.getRowInputByIndex(activeRow, 0);

        if (input) {
            this.removeAutocomplete(input)
        }

        tbody.removeChild(activeRow);

        var newSelectedRow = nextRow ? nextRow : prevRow;

        if (!newSelectedRow) {
            newSelectedRow = this.buildEmptyRow();
            tbody.appendChild(newSelectedRow)
        }

        this.focusAndMakeActive(newSelectedRow.querySelector('input'));
        this.updateScrollpads()
    };

    StringListAutocomplete.prototype.applyValues = function () {
        var tbody = this.getTableBody(),
            dataRows = tbody.querySelectorAll('tr'),
            link = this.getLink(),
            result = [];

        for (var i = 0, len = dataRows.length; i < len; i++) {
            var dataRow = dataRows[i],
                valueInput = this.getRowInputByIndex(dataRow, 0),
                value = $.trim(valueInput.value);

            if (value.length == 0) {
                continue
            }

            result.push(value)
        }

        this.inspector.setPropertyValue(this.propertyDefinition.property, result);
        this.setLinkText(link, result)
    };

    //
    // Helpers
    //

    StringListAutocomplete.prototype.getValueKeys = function (value) {
        var result = [];

        for (var key in value) {
            result.push(key)
        }

        return result
    };

    StringListAutocomplete.prototype.getActiveRow = function () {
        var activeCell = this.popup.querySelector('td.active');

        if (!activeCell) {
            return null
        }

        return activeCell.parentNode
    };

    StringListAutocomplete.prototype.getTableBody = function () {
        return this.popup.querySelector('table.inspector-dictionary-table tbody')
    };

    StringListAutocomplete.prototype.updateScrollpads = function () {
        $('.control-scrollpad', this.popup).scrollpad('update')
    };

    StringListAutocomplete.prototype.focusFirstInput = function () {
        var input = this.popup.querySelector('td input');

        if (input) {
            input.focus();
            this.setActiveCell(input)
        }
    };

    StringListAutocomplete.prototype.getEditorCell = function (cell) {
        return cell.parentNode.parentNode; // cell / div / td
    };

    StringListAutocomplete.prototype.getEditorRow = function (cell) {
        return cell.parentNode.parentNode.parentNode; // cell / div / td / tr
    };

    StringListAutocomplete.prototype.focusAndMakeActive = function (input) {
        input.focus();
        this.setActiveCell(input)
    };

    StringListAutocomplete.prototype.getRowInputByIndex = function (row, index) {
        return row.cells[index].querySelector('input')
    };

    //
    // Navigation
    //

    StringListAutocomplete.prototype.navigateDown = function (ev) {
        var cell = this.getEditorCell(ev.currentTarget),
            row = this.getEditorRow(ev.currentTarget),
            nextRow = row.nextElementSibling;

        if (!nextRow) {
            return
        }

        var newActiveEditor = nextRow.cells[cell.cellIndex].querySelector('input');

        this.focusAndMakeActive(newActiveEditor)
    };

    StringListAutocomplete.prototype.navigateUp = function (ev) {
        var cell = this.getEditorCell(ev.currentTarget),
            row = this.getEditorRow(ev.currentTarget),
            prevRow = row.previousElementSibling;

        if (!prevRow) {
            return
        }

        var newActiveEditor = prevRow.cells[cell.cellIndex].querySelector('input');

        this.focusAndMakeActive(newActiveEditor)
    };

    //
    // Autocomplete
    //

    StringListAutocomplete.prototype.initAutocomplete = function () {
        if (this.propertyDefinition.items !== undefined) {
            this.items = this.prepareItems(this.propertyDefinition.items);
            this.initializeAutocompleteForCurrentInput()
        }
        else {
            this.loadDynamicItems()
        }
    };

    StringListAutocomplete.prototype.initializeAutocompleteForCurrentInput = function () {
        var activeElement = document.activeElement;

        if (!activeElement) {
            return
        }

        var inputs = this.popup.querySelectorAll('td input.form-control');

        if (!inputs) {
            return
        }

        for (var i = inputs.length - 1; i >= 0; i--) {
            if (inputs[i] === activeElement) {
                this.buildAutoComplete(inputs[i]);
                return
            }
        }
    };

    StringListAutocomplete.prototype.buildAutoComplete = function (input) {
        if (this.items === null) {
            return
        }

        $(input).autocomplete({
            source: this.items,
            matchWidth: true,
            menu: '<ul class="autocomplete dropdown-menu inspector-autocomplete"></ul>',
            bodyContainer: true
        })
    };

    StringListAutocomplete.prototype.removeAutocomplete = function (input) {
        var $input = $(input);

        if (!$input.data('autocomplete')) {
            return
        }

        $input.autocomplete('destroy')
    };

    StringListAutocomplete.prototype.prepareItems = function (items) {
        var result = {};

        if ($.isArray(items)) {
            for (var i = 0, len = items.length; i < len; i++) {
                result[items[i]] = items[i]
            }
        }
        else {
            result = items
        }

        return result
    };

    StringListAutocomplete.prototype.loadDynamicItems = function () {
        if (this.isDisposed()) {
            return
        }

        var data = this.getRootSurface().getValues(),
            $form = $(this.popup).find('form');

        if (this.triggerGetItems(data) === false) {
            return
        }

        data['inspectorProperty'] = this.getPropertyPath();
        data['inspectorClassName'] = this.inspector.options.inspectorClass;

        $form.request('onInspectableGetOptions', {
            data: data,
        })
            .done(this.proxy(this.itemsRequestDone))
    };

    StringListAutocomplete.prototype.triggerGetItems = function (values) {
        var $inspectable = this.getInspectableElement();
        if (!$inspectable) {
            return true
        }

        var itemsEvent = $.Event('autocompleteitems.oc.inspector');

        $inspectable.trigger(itemsEvent, [{
            values: values,
            callback: this.proxy(this.itemsRequestDone),
            property: this.inspector.getPropertyPath(this.propertyDefinition.property),
            propertyDefinition: this.propertyDefinition
        }]);

        if (itemsEvent.isDefaultPrevented()) {
            return false
        }

        return true
    };

    StringListAutocomplete.prototype.itemsRequestDone = function (data) {
        if (this.isDisposed()) {
            // Handle the case when the asynchronous request finishes after
            // the editor is disposed
            return
        }

        var loadedItems = {};

        if (data.options) {
            for (var i = data.options.length - 1; i >= 0; i--) {
                loadedItems[data.options[i].value] = data.options[i].title
            }
        }

        this.items = this.prepareItems(loadedItems);
        this.initializeAutocompleteForCurrentInput()
    };

    StringListAutocomplete.prototype.removeAutocompleteFromAllRows = function () {
        var inputs = this.popup.querySelector('td input.form-control');

        for (var i = inputs.length - 1; i >= 0; i--) {
            this.removeAutocomplete(inputs[i])
        }
    };

    //
    // Event handlers
    //

    StringListAutocomplete.prototype.onPopupShown = function (ev, link, popup) {
        BaseProto.onPopupShown.call(this, ev, link, popup);

        popup.on('focus.inspector', 'td input', this.proxy(this.onFocus));
        popup.on('blur.inspector', 'td input', this.proxy(this.onBlur));
        popup.on('keydown.inspector', 'td input', this.proxy(this.onKeyDown));
        popup.on('click.inspector', '[data-cmd]', this.proxy(this.onCommand))
    };

    StringListAutocomplete.prototype.onPopupHidden = function (ev, link, popup) {
        popup.off('.inspector', 'td input');
        popup.off('.inspector', '[data-cmd]', this.proxy(this.onCommand));

        this.removeAutocompleteFromAllRows();
        this.items = null;

        BaseProto.onPopupHidden.call(this, ev, link, popup)
    };

    StringListAutocomplete.prototype.onFocus = function (ev) {
        this.setActiveCell(ev.currentTarget)
    };

    StringListAutocomplete.prototype.onBlur = function (ev) {
        if ($(ev.relatedTarget).closest('ul.inspector-autocomplete').length > 0) {
            // Do not close the autocomplete results if a drop-down
            // menu item was clicked
            return
        }

        this.removeAutocomplete(ev.currentTarget)
    };

    StringListAutocomplete.prototype.onCommand = function (ev) {
        var command = ev.currentTarget.getAttribute('data-cmd');

        switch (command) {
            case 'create-item' :
                this.createItem();
                break;
            case 'delete-item' :
                this.deleteItem();
                break;
        }
    };

    StringListAutocomplete.prototype.onKeyDown = function (ev) {
        if (ev.keyCode == 40) {
            return this.navigateDown(ev)
        }
        else if (ev.keyCode == 38) {
            return this.navigateUp(ev)
        }
    };

    Storm.inspector.propertyEditors.stringListAutocomplete = StringListAutocomplete
}(window.jQuery);
/*
 * Inspector dictionary editor class.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.popupBase,
        BaseProto = Base.prototype;

    var DictionaryEditor = function (inspector, propertyDefinition, containerCell, group) {
        this.keyValidationSet = null;
        this.valueValidationSet = null;

        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    DictionaryEditor.prototype = Object.create(BaseProto);
    DictionaryEditor.prototype.constructor = Base;

    DictionaryEditor.prototype.dispose = function () {
        this.disposeValidators();

        this.keyValidationSet = null;
        this.valueValidationSet = null;

        BaseProto.dispose.call(this)
    };

    DictionaryEditor.prototype.init = function () {
        this.initValidators();

        BaseProto.init.call(this)
    };

    DictionaryEditor.prototype.supportsExternalParameterEditor = function () {
        return false
    };

    //
    // Popup editor methods
    //

    DictionaryEditor.prototype.setLinkText = function (link, value) {
        var value = value !== undefined ? value
            : this.inspector.getPropertyValue(this.propertyDefinition.property);

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        if (value === undefined || $.isEmptyObject(value)) {
            var placeholder = this.propertyDefinition.placeholder;

            if (placeholder !== undefined) {
                Storm.foundation.element.addClass(link, 'placeholder');
                link.textContent = placeholder
            }
            else {
                link.textContent = 'Items: 0'
            }
        }
        else {
            if (typeof value !== 'object') {
                this.throwError('Object list value should be an object.')
            }

            var itemCount = this.getValueKeys(value).length;

            Storm.foundation.element.removeClass(link, 'placeholder');
            link.textContent = 'Items: ' + itemCount
        }
    };

    DictionaryEditor.prototype.getPopupContent = function () {
        return '<form>                                                                                  \
                <div class="modal-header">                                                              \
                    <button type="button" class="close" data-dismiss="popup">&times;</button>           \
                    <h4 class="modal-title">{{property}}</h4>                                           \
                </div>                                                                                  \
                <div class="modal-body">                                                                \
                    <div class="control-toolbar">                                                       \
                        <div class="toolbar-item">                                                      \
                            <div class="btn-group">                                                     \
                                <button type="button" class="btn btn-primary                            \
                                    oc-icon-plus"                                                       \
                                    data-cmd="create-item">Add</button>                                 \
                                <button type="button" class="btn btn-default                            \
                                    empty oc-icon-trash-o"                                              \
                                    data-cmd="delete-item"></button>                                    \
                            </div>                                                                      \
                        </div>                                                                          \
                    </div>                                                                              \
                    <div class="form-group">                                                            \
                        <div class="inspector-dictionary-container">                                    \
                            <table class="headers">                                                     \
                                <thead>                                                                 \
                                    <tr>                                                                \
                                        <td>Key</td>                                                    \
                                        <td>Value</td>                                                  \
                                    </tr>                                                               \
                                </thead>                                                                \
                            </table>                                                                    \
                            <div class="values">                                                        \
                                <div class="control-scrollpad"                                          \
                                    data-control="scrollpad">                                           \
                                    <div class="scroll-wrapper">                                        \
                                        <table class="                                                  \
                                            no-offset-bottom                                            \
                                            inspector-dictionary-table">                                \
                                        </table>                                                        \
                                    </div>                                                              \
                                </div>                                                                  \
                            </div>                                                                      \
                        </div>                                                                          \
                    </div>                                                                              \
                </div>                                                                                  \
                <div class="modal-footer">                                                              \
                    <button type="submit" class="btn btn-primary">OK</button>                           \
                    <button type="button" class="btn btn-default" data-dismiss="popup">Cancel</button>  \
                </div>                                                                                  \
                </form>'
    };

    DictionaryEditor.prototype.configurePopup = function (popup) {
        this.buildItemsTable(popup.get(0));

        this.focusFirstInput()
    };

    DictionaryEditor.prototype.handleSubmit = function ($form) {
        return this.applyValues()
    };

    //
    // Building and row management
    //

    DictionaryEditor.prototype.buildItemsTable = function (popup) {
        var table = popup.querySelector('table.inspector-dictionary-table'),
            tbody = document.createElement('tbody'),
            items = this.inspector.getPropertyValue(this.propertyDefinition.property),
            titleProperty = this.propertyDefinition.titleProperty;

        if (items === undefined) {
            items = this.propertyDefinition.default
        }

        if (items === undefined || this.getValueKeys(items).length === 0) {
            var row = this.buildEmptyRow();

            tbody.appendChild(row)
        }
        else {
            for (var key in items) {
                var row = this.buildTableRow(key, items[key]);

                tbody.appendChild(row)
            }
        }

        table.appendChild(tbody);
        this.updateScrollpads()
    };

    DictionaryEditor.prototype.buildTableRow = function (key, value) {
        var row = document.createElement('tr'),
            keyCell = document.createElement('td'),
            valueCell = document.createElement('td');

        this.createInput(keyCell, key);
        this.createInput(valueCell, value);

        row.appendChild(keyCell);
        row.appendChild(valueCell);

        return row
    };

    DictionaryEditor.prototype.buildEmptyRow = function () {
        return this.buildTableRow(null, null)
    };

    DictionaryEditor.prototype.createInput = function (container, value) {
        var input = document.createElement('input'),
            controlContainer = document.createElement('div');

        input.setAttribute('type', 'text');
        input.setAttribute('class', 'form-control');
        input.value = value;

        controlContainer.appendChild(input);
        container.appendChild(controlContainer)
    };

    DictionaryEditor.prototype.setActiveCell = function (input) {
        var activeCells = this.popup.querySelectorAll('td.active');

        for (var i = activeCells.length - 1; i >= 0; i--) {
            Storm.foundation.element.removeClass(activeCells[i], 'active')
        }

        var activeCell = input.parentNode.parentNode; // input / div / td
        Storm.foundation.element.addClass(activeCell, 'active')
    };

    DictionaryEditor.prototype.createItem = function () {
        var activeRow = this.getActiveRow(),
            newRow = this.buildEmptyRow(),
            tbody = this.getTableBody(),
            nextSibling = activeRow ? activeRow.nextElementSibling : null;

        tbody.insertBefore(newRow, nextSibling);

        this.focusAndMakeActive(newRow.querySelector('input'));
        this.updateScrollpads()
    };

    DictionaryEditor.prototype.deleteItem = function () {
        var activeRow = this.getActiveRow(),
            tbody = this.getTableBody();

        if (!activeRow) {
            return
        }

        var nextRow = activeRow.nextElementSibling,
            prevRow = activeRow.previousElementSibling;

        tbody.removeChild(activeRow);

        var newSelectedRow = nextRow ? nextRow : prevRow;

        if (!newSelectedRow) {
            newSelectedRow = this.buildEmptyRow();
            tbody.appendChild(newSelectedRow)
        }

        this.focusAndMakeActive(newSelectedRow.querySelector('input'));
        this.updateScrollpads()
    };

    DictionaryEditor.prototype.applyValues = function () {
        var tbody = this.getTableBody(),
            dataRows = tbody.querySelectorAll('tr'),
            link = this.getLink(),
            result = {};

        for (var i = 0, len = dataRows.length; i < len; i++) {
            var dataRow = dataRows[i],
                keyInput = this.getRowInputByIndex(dataRow, 0),
                valueInput = this.getRowInputByIndex(dataRow, 1),
                key = $.trim(keyInput.value),
                value = $.trim(valueInput.value);

            if (key.length == 0 && value.length == 0) {
                continue
            }

            if (key.length == 0) {
                Storm.flashMsg({text: 'The key cannot be empty.', 'class': 'error', 'interval': 3});
                this.focusAndMakeActive(keyInput);
                return false
            }

            if (value.length == 0) {
                Storm.flashMsg({text: 'The value cannot be empty.', 'class': 'error', 'interval': 3});
                this.focusAndMakeActive(valueInput);
                return false
            }

            if (result[key] !== undefined) {
                Storm.flashMsg({text: 'Keys should be unique.', 'class': 'error', 'interval': 3});
                this.focusAndMakeActive(keyInput);
                return false
            }

            var validationResult = this.keyValidationSet.validate(key);
            if (validationResult !== null) {
                Storm.flashMsg({text: validationResult, 'class': 'error', 'interval': 5});
                return false
            }

            validationResult = this.valueValidationSet.validate(value);
            if (validationResult !== null) {
                Storm.flashMsg({text: validationResult, 'class': 'error', 'interval': 5});
                return false
            }

            result[key] = value
        }

        this.inspector.setPropertyValue(this.propertyDefinition.property, result);
        this.setLinkText(link, result)
    };

    //
    // Helpers
    //

    DictionaryEditor.prototype.getValueKeys = function (value) {
        var result = [];

        for (var key in value) {
            result.push(key)
        }

        return result
    };

    DictionaryEditor.prototype.getActiveRow = function () {
        var activeCell = this.popup.querySelector('td.active');

        if (!activeCell) {
            return null
        }

        return activeCell.parentNode
    };

    DictionaryEditor.prototype.getTableBody = function () {
        return this.popup.querySelector('table.inspector-dictionary-table tbody')
    };

    DictionaryEditor.prototype.updateScrollpads = function () {
        $('.control-scrollpad', this.popup).scrollpad('update')
    };

    DictionaryEditor.prototype.focusFirstInput = function () {
        var input = this.popup.querySelector('td input');

        if (input) {
            input.focus();
            this.setActiveCell(input)
        }
    };

    DictionaryEditor.prototype.getEditorCell = function (cell) {
        return cell.parentNode.parentNode; // cell / div / td
    };

    DictionaryEditor.prototype.getEditorRow = function (cell) {
        return cell.parentNode.parentNode.parentNode; // cell / div / td / tr
    };

    DictionaryEditor.prototype.focusAndMakeActive = function (input) {
        input.focus();
        this.setActiveCell(input)
    };

    DictionaryEditor.prototype.getRowInputByIndex = function (row, index) {
        return row.cells[index].querySelector('input')
    };

    //
    // Navigation
    //

    DictionaryEditor.prototype.navigateDown = function (ev) {
        var cell = this.getEditorCell(ev.currentTarget),
            row = this.getEditorRow(ev.currentTarget),
            nextRow = row.nextElementSibling;

        if (!nextRow) {
            return
        }

        var newActiveEditor = nextRow.cells[cell.cellIndex].querySelector('input');

        this.focusAndMakeActive(newActiveEditor)
    };

    DictionaryEditor.prototype.navigateUp = function (ev) {
        var cell = this.getEditorCell(ev.currentTarget),
            row = this.getEditorRow(ev.currentTarget),
            prevRow = row.previousElementSibling;

        if (!prevRow) {
            return
        }

        var newActiveEditor = prevRow.cells[cell.cellIndex].querySelector('input');

        this.focusAndMakeActive(newActiveEditor)
    };

    //
    // Validation
    //

    DictionaryEditor.prototype.initValidators = function () {
        this.keyValidationSet = new Storm.inspector.validationSet({
            validation: this.propertyDefinition.validationKey
        }, this.propertyDefinition.property + '.validationKey');

        this.valueValidationSet = new Storm.inspector.validationSet({
            validation: this.propertyDefinition.validationValue
        }, this.propertyDefinition.property + '.validationValue')
    };

    DictionaryEditor.prototype.disposeValidators = function () {
        this.keyValidationSet.dispose();
        this.valueValidationSet.dispose()
    };

    //
    // Event handlers
    //

    DictionaryEditor.prototype.onPopupShown = function (ev, link, popup) {
        BaseProto.onPopupShown.call(this, ev, link, popup);

        popup.on('focus.inspector', 'td input', this.proxy(this.onFocus));
        popup.on('keydown.inspector', 'td input', this.proxy(this.onKeyDown));
        popup.on('click.inspector', '[data-cmd]', this.proxy(this.onCommand))
    };

    DictionaryEditor.prototype.onPopupHidden = function (ev, link, popup) {
        popup.off('.inspector', 'td input');
        popup.off('.inspector', '[data-cmd]', this.proxy(this.onCommand));

        BaseProto.onPopupHidden.call(this, ev, link, popup)
    };

    DictionaryEditor.prototype.onFocus = function (ev) {
        this.setActiveCell(ev.currentTarget)
    };

    DictionaryEditor.prototype.onCommand = function (ev) {
        var command = ev.currentTarget.getAttribute('data-cmd');

        switch (command) {
            case 'create-item' :
                this.createItem();
                break;
            case 'delete-item' :
                this.deleteItem();
                break;
        }
    };

    DictionaryEditor.prototype.onKeyDown = function (ev) {
        if (ev.keyCode == 40) {
            return this.navigateDown(ev)
        }
        else if (ev.keyCode == 38) {
            return this.navigateUp(ev)
        }
    };

    Storm.inspector.propertyEditors.dictionary = DictionaryEditor
}(window.jQuery);
/*
 * Inspector autocomplete editor class.
 *
 * Depends on october.autocomplete.js
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.propertyEditors.string,
        BaseProto = Base.prototype;

    var AutocompleteEditor = function (inspector, propertyDefinition, containerCell, group) {
        this.autoUpdateTimeout = null;

        Base.call(this, inspector, propertyDefinition, containerCell, group)
    };

    AutocompleteEditor.prototype = Object.create(BaseProto);
    AutocompleteEditor.prototype.constructor = Base;

    AutocompleteEditor.prototype.dispose = function () {
        this.clearAutoUpdateTimeout();
        this.removeAutocomplete();

        BaseProto.dispose.call(this)
    };

    AutocompleteEditor.prototype.build = function () {
        var container = document.createElement('div'),
            editor = document.createElement('input'),
            placeholder = this.propertyDefinition.placeholder !== undefined ? this.propertyDefinition.placeholder : '',
            value = this.inspector.getPropertyValue(this.propertyDefinition.property);

        editor.setAttribute('type', 'text');
        editor.setAttribute('class', 'string-editor');
        editor.setAttribute('placeholder', placeholder);

        container.setAttribute('class', 'autocomplete-container');

        if (value === undefined) {
            value = this.propertyDefinition.default
        }

        if (value === undefined) {
            value = ''
        }

        editor.value = value;

        Storm.foundation.element.addClass(this.containerCell, 'text autocomplete');

        container.appendChild(editor);
        this.containerCell.appendChild(container);

        if (this.propertyDefinition.items !== undefined) {
            this.buildAutoComplete(this.propertyDefinition.items)
        }
        else {
            this.loadDynamicItems()
        }
    };

    AutocompleteEditor.prototype.buildAutoComplete = function (items) {
        var input = this.getInput();

        if (items === undefined) {
            items = []
        }

        var $input = $(input),
            autocomplete = $input.data('autocomplete');

        if (!autocomplete) {
            $input.autocomplete({
                source: this.prepareItems(items),
                matchWidth: true
            })
        }
        else {
            autocomplete.source = this.prepareItems(items)
        }
    };

    AutocompleteEditor.prototype.removeAutocomplete = function () {
        var input = this.getInput();

        $(input).autocomplete('destroy')
    };

    AutocompleteEditor.prototype.prepareItems = function (items) {
        var result = {};

        if ($.isArray(items)) {
            for (var i = 0, len = items.length; i < len; i++) {
                result[items[i]] = items[i]
            }
        }
        else {
            result = items
        }

        return result
    };

    AutocompleteEditor.prototype.supportsExternalParameterEditor = function () {
        return false
    };

    AutocompleteEditor.prototype.getContainer = function () {
        return this.getInput().parentNode
    };

    AutocompleteEditor.prototype.registerHandlers = function () {
        BaseProto.registerHandlers.call(this);

        $(this.getInput()).on('change', this.proxy(this.onInputKeyUp))
    };

    AutocompleteEditor.prototype.unregisterHandlers = function () {
        BaseProto.unregisterHandlers.call(this);

        $(this.getInput()).off('change', this.proxy(this.onInputKeyUp))
    };

    AutocompleteEditor.prototype.saveDependencyValues = function () {
        this.prevDependencyValues = this.getDependencyValues()
    };

    AutocompleteEditor.prototype.getDependencyValues = function () {
        var result = '';

        for (var i = 0, len = this.propertyDefinition.depends.length; i < len; i++) {
            var property = this.propertyDefinition.depends[i],
                value = this.inspector.getPropertyValue(property);

            if (value === undefined) {
                value = '';
            }

            result += property + ':' + value + '-'
        }

        return result
    };

    AutocompleteEditor.prototype.onInspectorPropertyChanged = function (property, value) {
        if (!this.propertyDefinition.depends || this.propertyDefinition.depends.indexOf(property) === -1) {
            return
        }

        this.clearAutoUpdateTimeout();

        if (this.prevDependencyValues === undefined || this.prevDependencyValues != dependencyValues) {
            this.autoUpdateTimeout = setTimeout(this.proxy(this.loadDynamicItems), 200)
        }
    };

    AutocompleteEditor.prototype.clearAutoUpdateTimeout = function () {
        if (this.autoUpdateTimeout !== null) {
            clearTimeout(this.autoUpdateTimeout);
            this.autoUpdateTimeout = null
        }
    };

    //
    // Dynamic items
    //

    AutocompleteEditor.prototype.showLoadingIndicator = function () {
        $(this.getContainer()).loadIndicator()
    };

    AutocompleteEditor.prototype.hideLoadingIndicator = function () {
        if (this.isDisposed()) {
            return
        }

        var $container = $(this.getContainer());

        $container.loadIndicator('hide');
        $container.loadIndicator('destroy');

        $container.removeClass('loading-indicator-container')
    };

    AutocompleteEditor.prototype.loadDynamicItems = function () {
        if (this.isDisposed()) {
            return
        }

        this.clearAutoUpdateTimeout();

        var container = this.getContainer(),
            data = this.getRootSurface().getValues(),
            $form = $(container).closest('form');

        Storm.foundation.element.addClass(container, 'loading-indicator-container size-small');
        this.showLoadingIndicator();

        if (this.triggerGetItems(data) === false) {
            return
        }

        data['inspectorProperty'] = this.getPropertyPath();
        data['inspectorClassName'] = this.inspector.options.inspectorClass;

        $form.request('onInspectableGetOptions', {
            data: data,
        })
            .done(this.proxy(this.itemsRequestDone))
            .always(this.proxy(this.hideLoadingIndicator))
    };

    AutocompleteEditor.prototype.triggerGetItems = function (values) {
        var $inspectable = this.getInspectableElement();
        if (!$inspectable) {
            return true
        }

        var itemsEvent = $.Event('autocompleteitems.oc.inspector');

        $inspectable.trigger(itemsEvent, [{
            values: values,
            callback: this.proxy(this.itemsRequestDone),
            property: this.inspector.getPropertyPath(this.propertyDefinition.property),
            propertyDefinition: this.propertyDefinition
        }]);

        if (itemsEvent.isDefaultPrevented()) {
            return false
        }

        return true
    };

    AutocompleteEditor.prototype.itemsRequestDone = function (data) {
        if (this.isDisposed()) {
            // Handle the case when the asynchronous request finishes after
            // the editor is disposed
            return
        }

        this.hideLoadingIndicator();

        var loadedItems = {};

        if (data.options) {
            for (var i = data.options.length - 1; i >= 0; i--) {
                loadedItems[data.options[i].value] = data.options[i].title
            }
        }

        this.buildAutoComplete(loadedItems)
    };

    Storm.inspector.propertyEditors.autocomplete = AutocompleteEditor
}(window.jQuery);
/*
 * Inspector helper functions.
 *
 */
+function ($) {
    "use strict";

    // NAMESPACES
    // ============================

    if (window.Storm === undefined) {
        window.Storm = {};
    }

    if (Storm.inspector === undefined)
        Storm.inspector = {};

    Storm.inspector.helpers = {};

    Storm.inspector.helpers.generateElementUniqueId = function (element) {
        if (element.hasAttribute('data-inspector-id')) {
            return element.getAttribute('data-inspector-id')
        }

        var id = Storm.inspector.helpers.generateUniqueId();
        element.setAttribute('data-inspector-id', id);

        return id
    };

    Storm.inspector.helpers.generateUniqueId = function () {
        return "inspectorid-" + Math.floor(Math.random() * new Date().getTime());
    }

}(window.jQuery);
/*
 * Inspector validation set class.
 */
+function ($) {
    "use strict";

    // NAMESPACES
    // ============================

    if (Storm.inspector.validators === undefined)
        Storm.inspector.validators = {};

    // CLASS DEFINITION
    // ============================

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var ValidationSet = function (options, propertyName) {
        this.validators = [];

        this.options = options;
        this.propertyName = propertyName;
        Base.call(this);

        this.createValidators()
    };

    ValidationSet.prototype = Object.create(BaseProto);
    ValidationSet.prototype.constructor = Base;

    ValidationSet.prototype.dispose = function () {
        this.disposeValidators();
        this.validators = null;

        BaseProto.dispose.call(this)
    };

    ValidationSet.prototype.disposeValidators = function () {
        for (var i = 0, len = this.validators.length; i < len; i++) {
            this.validators[i].dispose()
        }
    };

    ValidationSet.prototype.throwError = function (errorMessage) {
        throw new Error(errorMessage + ' Property: ' + this.propertyName)
    };

    ValidationSet.prototype.createValidators = function () {
        // Handle legacy validation syntax properties:
        //
        // - required
        // - validationPattern
        // - validationMessage 

        if ((this.options.required !== undefined ||
            this.options.validationPattern !== undefined ||
            this.options.validationMessage !== undefined) &&
            this.options.validation !== undefined) {
            this.throwError('Legacy and new validation syntax should not be mixed.')
        }

        if (this.options.required !== undefined) {
            var validator = new Storm.inspector.validators.required({
                message: this.options.validationMessage
            });

            this.validators.push(validator)
        }

        if (this.options.validationPattern !== undefined) {
            var validator = new Storm.inspector.validators.regex({
                message: this.options.validationMessage,
                pattern: this.options.validationPattern
            });

            this.validators.push(validator)
        }

        //
        // Handle new validation syntax
        //

        if (this.options.validation === undefined) {
            return
        }

        for (var validatorName in this.options.validation) {
            if (Storm.inspector.validators[validatorName] == undefined) {
                this.throwError('Inspector validator "' + validatorName + '" is not found in the Storm.inspector.validators namespace.')
            }

            var validator = new Storm.inspector.validators[validatorName](
                this.options.validation[validatorName]
            );

            this.validators.push(validator)
        }
    };

    ValidationSet.prototype.validate = function (value) {
        try {
            for (var i = 0, len = this.validators.length; i < len; i++) {
                var validator = this.validators[i],
                    errorMessage = validator.isValid(value);

                if (typeof errorMessage === 'string') {
                    return errorMessage
                }
            }

            return null
        }
        catch (err) {
            this.throwError(err)
        }
    };

    Storm.inspector.validationSet = ValidationSet
}(window.jQuery);
/*
 * Inspector validator base class.
 */
+function ($) {
    "use strict";

    // NAMESPACES
    // ============================

    if (Storm.inspector.validators === undefined)
        Storm.inspector.validators = {};

    // CLASS DEFINITION
    // ============================

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var BaseValidator = function (options) {
        this.options = options;
        this.defaultMessage = 'Invalid property value.';

        Base.call(this)
    };

    BaseValidator.prototype = Object.create(BaseProto);
    BaseValidator.prototype.constructor = Base;

    BaseValidator.prototype.dispose = function () {
        this.defaultMessage = null;

        BaseProto.dispose.call(this)
    };

    BaseValidator.prototype.getMessage = function (defaultMessage) {
        if (this.options.message !== undefined) {
            return this.options.message
        }

        if (defaultMessage !== undefined) {
            return defaultMessage
        }

        return this.defaultMessage
    };

    BaseValidator.prototype.isScalar = function (value) {
        if (value === undefined || value === null) {
            return true
        }

        return !!(typeof value === 'string' || typeof value == 'number' || typeof value == 'boolean');
    };

    BaseValidator.prototype.isValid = function (value) {
        return null
    };

    Storm.inspector.validators.base = BaseValidator
}(window.jQuery);
/*
 * Base class for Inspector numeric validators.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.validators.base,
        BaseProto = Base.prototype;

    var BaseNumber = function (options) {
        Base.call(this, options)
    };

    BaseNumber.prototype = Object.create(BaseProto);
    BaseNumber.prototype.constructor = Base;

    BaseNumber.prototype.doCommonChecks = function (value) {
        if (this.options.min !== undefined || this.options.max !== undefined) {
            if (this.options.min !== undefined) {
                if (this.options.min.value === undefined) {
                    throw new Error('The min.value parameter is not defined in the Inspector validator configuration')
                }

                if (value < this.options.min.value) {
                    return this.options.min.message !== undefined ?
                        this.options.min.message :
                        "The value should not be less than " + this.options.min.value
                }
            }

            if (this.options.max !== undefined) {
                if (this.options.max.value === undefined) {
                    throw new Error('The max.value parameter is not defined in the table Inspector validator configuration')
                }

                if (value > this.options.max.value) {
                    return this.options.max.message !== undefined ?
                        this.options.max.message :
                        "The value should not be greater than " + this.options.max.value
                }
            }
        }
    };

    Storm.inspector.validators.baseNumber = BaseNumber
}(window.jQuery);
/*
 * Inspector required validator.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.validators.base,
        BaseProto = Base.prototype;

    var RequiredValidator = function (options) {
        Base.call(this, options);

        this.defaultMessage = 'The property is required.'
    };

    RequiredValidator.prototype = Object.create(BaseProto);
    RequiredValidator.prototype.constructor = Base;

    RequiredValidator.prototype.isValid = function (value) {
        if (value === undefined || value === null) {
            return this.getMessage()
        }

        if (typeof value === 'boolean') {
            return value ? null : this.getMessage()
        }

        if (typeof value === 'object') {
            return !$.isEmptyObject(value) ? null : this.getMessage()
        }

        return $.trim(String(value)).length > 0 ? null : this.getMessage()
    };

    Storm.inspector.validators.required = RequiredValidator
}(window.jQuery);
/*
 * Inspector regex validator.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.validators.base,
        BaseProto = Base.prototype;

    var RegexValidator = function (options) {
        Base.call(this, options)
    };

    RegexValidator.prototype = Object.create(BaseProto);
    RegexValidator.prototype.constructor = Base;

    RegexValidator.prototype.isValid = function (value) {
        if (this.options.pattern === undefined) {
            this.throwError('The pattern parameter is not defined in the Regex Inspector validator configuration.')
        }

        if (!this.isScalar(value)) {
            this.throwError('The Regex Inspector validator can only be used with string values.')
        }

        if (value === undefined || value === null) {
            return null
        }

        var string = $.trim(String(value));

        if (string.length === 0) {
            return null
        }

        var regexObj = new RegExp(this.options.pattern, this.options.modifiers);

        return regexObj.test(string) ? null : this.getMessage()
    };

    Storm.inspector.validators.regex = RegexValidator
}(window.jQuery);
/*
 * Inspector integer validator.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.validators.baseNumber,
        BaseProto = Base.prototype;

    var IntegerValidator = function (options) {
        Base.call(this, options)
    };

    IntegerValidator.prototype = Object.create(BaseProto);
    IntegerValidator.prototype.constructor = Base;

    IntegerValidator.prototype.isValid = function (value) {
        if (!this.isScalar(value) || typeof value == 'boolean') {
            this.throwError('The Integer Inspector validator can only be used with string values.')
        }

        if (value === undefined || value === null) {
            return null
        }

        var string = $.trim(String(value));

        if (string.length === 0) {
            return null
        }

        var testResult = this.options.allowNegative ?
            /^\-?[0-9]*$/.test(string) :
            /^[0-9]*$/.test(string);

        if (!testResult) {
            var defaultMessage = this.options.allowNegative ?
                'The value should be an integer.' :
                'The value should be a positive integer.';

            return this.getMessage(defaultMessage)
        }

        return this.doCommonChecks(parseInt(string))
    };

    Storm.inspector.validators.integer = IntegerValidator
}(window.jQuery);
/*
 * Inspector float validator.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.validators.baseNumber,
        BaseProto = Base.prototype;

    var FloatValidator = function (options) {
        Base.call(this, options)
    };

    FloatValidator.prototype = Object.create(BaseProto);
    FloatValidator.prototype.constructor = Base;

    FloatValidator.prototype.isValid = function (value) {
        if (!this.isScalar(value) || typeof value == 'boolean') {
            this.throwError('The Float Inspector validator can only be used with string values.')
        }

        if (value === undefined || value === null) {
            return null
        }

        var string = $.trim(String(value));

        if (string.length === 0) {
            return null
        }

        var testResult = this.options.allowNegative ?
            /^[-]?([0-9]+\.[0-9]+|[0-9]+)$/.test(string) :
            /^([0-9]+\.[0-9]+|[0-9]+)$/.test(string);

        if (!testResult) {
            var defaultMessage = this.options.allowNegative ?
                'The value should be a floating point number.' :
                'The value should be a positive floating point number.';

            return this.getMessage(defaultMessage)
        }

        return this.doCommonChecks(parseFloat(string))
    };

    Storm.inspector.validators.float = FloatValidator
}(window.jQuery);
/*
 * Inspector length validator.
 */
+function ($) {
    "use strict";

    var Base = Storm.inspector.validators.base,
        BaseProto = Base.prototype;

    var LengthValidator = function (options) {
        Base.call(this, options)
    };

    LengthValidator.prototype = Object.create(BaseProto);
    LengthValidator.prototype.constructor = Base;

    LengthValidator.prototype.isValid = function (value) {
        if (value === undefined || value === null) {
            return null
        }

        if (typeof value == 'boolean') {
            this.throwError('The Length Inspector validator cannot work with Boolean values.')

        }

        var length = null;

        if (Object.prototype.toString.call(value) === '[object Array]' || typeof value === 'string') {
            length = value.length
        }
        else if (typeof value === 'object') {
            length = this.getObjectLength(value)
        }

        if (this.options.min !== undefined || this.options.max !== undefined) {
            if (this.options.min !== undefined) {
                if (this.options.min.value === undefined) {
                    throw new Error('The min.value parameter is not defined in the Length Inspector validator configuration.')
                }

                if (length < this.options.min.value) {
                    return this.options.min.message !== undefined ?
                        this.options.min.message :
                        "The value should not be shorter than " + this.options.min.value
                }
            }

            if (this.options.max !== undefined) {
                if (this.options.max.value === undefined)
                    throw new Error('The max.value parameter is not defined in the Length Inspector validator configuration.');

                if (length > this.options.max.value) {
                    return this.options.max.message !== undefined ?
                        this.options.max.message :
                        "The value should not be longer than " + this.options.max.value
                }
            }
        }
    };

    LengthValidator.prototype.getObjectLength = function (value) {
        var result = 0;

        for (var key in value) {
            result++
        }

        return result
    };

    Storm.inspector.validators.length = LengthValidator
}(window.jQuery);
/*
 * External parameter editor for Inspector.
 *
 * The external parameter editor allows to use URL and 
 * other external parameters as values for the inspectable
 * properties.
 *
 */
+function ($) {
    "use strict";

    // NAMESPACES
    // ============================

    if (window.Storm === undefined) {
        window.Storm = {};
    }

    if (Storm.inspector === undefined)
        Storm.inspector = {};

    // CLASS DEFINITION
    // ============================

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype;

    var ExternalParameterEditor = function (inspector, propertyDefinition, containerCell, initialValue) {
        this.inspector = inspector;
        this.propertyDefinition = propertyDefinition;
        this.containerCell = containerCell;
        this.initialValue = initialValue;

        Base.call(this);

        this.init()
    };

    ExternalParameterEditor.prototype = Object.create(BaseProto);
    ExternalParameterEditor.prototype.constructor = Base;

    ExternalParameterEditor.prototype.dispose = function () {
        this.disposeControls();
        this.unregisterHandlers();

        this.inspector = null;
        this.propertyDefinition = null;
        this.containerCell = null;
        this.initialValue = null;

        BaseProto.dispose.call(this)
    };

    ExternalParameterEditor.prototype.init = function () {
        this.tooltipText = 'Click to enter the external parameter name to load the property value from';

        this.build();
        this.registerHandlers();
        this.setInitialValue()
    };

    /**
     * Builds the external parameter editor markup:
     *
     * <div class="external-param-editor-container">
     *     <input> <-- original property editing input/markup
     *     <div class="external-editor">
     *         <div class="controls">
     *             <input type="text" tabindex="-1"/>
     *             <a href="#" tabindex="-1">
     *                 <i class="oc-icon-terminal"></i>
     *             </a>
     *         </div>
     *     </div>
     * </div>
     */
    ExternalParameterEditor.prototype.build = function () {
        var container = document.createElement('div'),
            editor = document.createElement('div'),
            controls = document.createElement('div'),
            input = document.createElement('input'),
            link = document.createElement('a'),
            icon = document.createElement('i');

        container.setAttribute('class', 'external-param-editor-container');
        editor.setAttribute('class', 'external-editor');
        controls.setAttribute('class', 'controls');
        input.setAttribute('type', 'text');
        input.setAttribute('tabindex', '-1');

        link.setAttribute('href', '#');
        link.setAttribute('class', 'external-editor-link');
        link.setAttribute('tabindex', '-1');
        link.setAttribute('title', this.tooltipText);
        $(link).tooltip({'container': 'body', delay: 500});

        icon.setAttribute('class', 'oc-icon-terminal');

        link.appendChild(icon);
        controls.appendChild(input);
        controls.appendChild(link);
        editor.appendChild(controls);

        while (this.containerCell.firstChild) {
            var child = this.containerCell.firstChild;

            container.appendChild(child)
        }

        container.appendChild(editor);
        this.containerCell.appendChild(container)
    };

    ExternalParameterEditor.prototype.setInitialValue = function () {
        if (!this.initialValue) {
            return
        }

        if (typeof this.initialValue !== 'string') {
            return
        }

        var matches = [];
        if (matches = this.initialValue.match(/^\{\{([^\}]+)\}\}$/)) {
            var value = $.trim(matches[1]);

            if (value.length > 0) {
                this.showEditor(true);
                this.getInput().value = value;
                this.inspector.setPropertyValue(this.propertyDefinition.property, null, true, true)
            }
        }
    };

    ExternalParameterEditor.prototype.showEditor = function (building) {
        var editor = this.getEditor(),
            input = this.getInput(),
            container = this.getContainer(),
            link = this.getLink();

        var position = $(editor).position();

        if (!building) {
            editor.style.right = 0;
            editor.style.left = position.left + 'px'
        }
        else {
            editor.style.right = 0
        }

        setTimeout(this.proxy(this.repositionEditor), 0);

        Storm.foundation.element.addClass(container, 'editor-visible');
        link.setAttribute('data-original-title', 'Click to enter the property value');

        this.toggleEditorVisibility(false);
        input.setAttribute('tabindex', 0);

        if (!building) {
            input.focus()
        }
    };

    ExternalParameterEditor.prototype.repositionEditor = function () {
        this.getEditor().style.left = 0;
        this.containerCell.scrollTop = 0
    };

    ExternalParameterEditor.prototype.hideEditor = function () {
        var editor = this.getEditor(),
            container = this.getContainer();

        editor.style.left = 'auto';
        editor.style.right = '30px';

        Storm.foundation.element.removeClass(container, 'editor-visible');
        Storm.foundation.element.removeClass(this.containerCell, 'active');

        var propertyEditor = this.inspector.findPropertyEditor(this.propertyDefinition.property);

        if (propertyEditor) {
            propertyEditor.onExternalPropertyEditorHidden()
        }
    };

    ExternalParameterEditor.prototype.toggleEditor = function (ev) {
        Storm.foundation.event.stop(ev);

        var link = this.getLink(),
            container = this.getContainer(),
            editor = this.getEditor();

        $(link).tooltip('hide');

        if (!this.isEditorVisible()) {
            this.showEditor();
            return
        }

        var left = container.offsetWidth;

        editor.style.left = left + 'px';
        link.setAttribute('data-original-title', this.tooltipText);
        this.getInput().setAttribute('tabindex', '-1');

        this.toggleEditorVisibility(true);

        setTimeout(this.proxy(this.hideEditor), 200)
    };

    ExternalParameterEditor.prototype.toggleEditorVisibility = function (show) {
        var container = this.getContainer(),
            children = container.children,
            height = 0;

        if (!show) {
            height = this.containerCell.getAttribute('data-inspector-cell-height');

            if (!height) {
                height = $(this.containerCell).height();
                this.containerCell.setAttribute('data-inspector-cell-height', height)
            }
        }

        // Fixed value instead of trying to get the container cell height.
        // If the editor is contained in initially hidden editor (collapsed group),
        // the container cell will be unknown.

        height = Math.max(height, 19);

        for (var i = 0, len = children.length; i < len; i++) {
            var element = children[i];

            if (Storm.foundation.element.hasClass(element, 'external-editor')) {
                continue
            }

            if (show) {
                Storm.foundation.element.removeClass(element, 'hide')
            }
            else {
                container.style.height = height + 'px';
                Storm.foundation.element.addClass(element, 'hide')
            }
        }
    };

    ExternalParameterEditor.prototype.focus = function () {
        this.getInput().focus()
    };

    ExternalParameterEditor.prototype.validate = function (silentMode) {
        var value = $.trim(this.getValue());

        if (value.length === 0) {
            if (!silentMode) {
                Storm.flashMsg({text: 'Please enter the external parameter name.', 'class': 'error', 'interval': 5});
                this.focus()
            }

            return false
        }

        return true
    };

    //
    // Event handlers
    //

    ExternalParameterEditor.prototype.registerHandlers = function () {
        var input = this.getInput();

        this.getLink().addEventListener('click', this.proxy(this.toggleEditor));
        input.addEventListener('focus', this.proxy(this.onInputFocus));
        input.addEventListener('change', this.proxy(this.onInputChange))
    };

    ExternalParameterEditor.prototype.onInputFocus = function () {
        this.inspector.makeCellActive(this.containerCell)
    };

    ExternalParameterEditor.prototype.onInputChange = function () {
        this.inspector.markPropertyChanged(this.propertyDefinition.property, true)
    };

    //
    // Disposing
    //

    ExternalParameterEditor.prototype.unregisterHandlers = function () {
        var input = this.getInput();

        this.getLink().removeEventListener('click', this.proxy(this.toggleEditor));
        input.removeEventListener('focus', this.proxy(this.onInputFocus));
        input.removeEventListener('change', this.proxy(this.onInputChange))
    };

    ExternalParameterEditor.prototype.disposeControls = function () {
        $(this.getLink()).tooltip('destroy')
    };

    //
    // Helpers
    //

    ExternalParameterEditor.prototype.getInput = function () {
        return this.containerCell.querySelector('div.external-editor input')
    };

    ExternalParameterEditor.prototype.getValue = function () {
        return this.getInput().value
    };

    ExternalParameterEditor.prototype.getLink = function () {
        return this.containerCell.querySelector('a.external-editor-link')
    };

    ExternalParameterEditor.prototype.getContainer = function () {
        return this.containerCell.querySelector('div.external-param-editor-container')
    };

    ExternalParameterEditor.prototype.getEditor = function () {
        return this.containerCell.querySelector('div.external-editor')
    };

    ExternalParameterEditor.prototype.getPropertyName = function () {
        return this.propertyDefinition.property
    };

    ExternalParameterEditor.prototype.isEditorVisible = function () {
        return Storm.foundation.element.hasClass(this.getContainer(), 'editor-visible')
    };

    Storm.inspector.externalParameterEditor = ExternalParameterEditor
}(window.jQuery);
/*
 * Sortable plugin.
 * 
 * Status: experimental. The behavior is not perfect, but it's OK in terms of memory
 * usage and disposing.
 *
 * This is a lightweight, October-style implementation of the drag & drop sorting
 * functionality. The plugin uses only HTML5 Drag&Drop feature and completely
 * disposable.
 *
 * During the dragging the plugin creates a placeholder element, which should be 
 * styled separately.
 *
 * Draggable elements should be marked with "draggable" HTML5 attribute.
 *
 * Current / planned features:
 *
 * [x] Sorting a single list.
 * [ ] Dragging items between multiple lists.
 * [ ] Sorting nested lists.

 * JAVASCRIPT API
 *
 * $('#list').listSortable({})
 *
 * DATA ATTRIBUTES API
 *
 * In the simplest case the plugin can be initialized like this:
 * <ul data-control="list-sortable">
 *     <li draggable="true">...</li>
 *
 * Multiple lists will not support this option and the plugin should be created 
 * and updated by a caller code.
 *
 * Options:
 * - handle: optional selector for a drag handle element. Also available as data-handle attribute.
 * - direction: direction of the list - horizontal or vertical. Also available as data-direction attribute. Default is vertical.
 *
 * Events:
 * - dragged.list.sortable - triggered on a list element after it was moved
 */

+function ($) {
    "use strict";

    var Base = Storm.foundation.base,
        BaseProto = Base.prototype,
        listSortableIdCounter = 0,
        elementsIdCounter = 0;

    var ListSortable = function (element, options) {
        this.lists = [];
        this.options = options;
        this.listSortableId = null;
        this.lastMousePosition = null;

        Base.call(this);

        Storm.foundation.controlUtils.markDisposable(element);
        this.init();

        this.addList(element)
    };

    ListSortable.prototype = Object.create(BaseProto);
    ListSortable.prototype.constructor = ListSortable;

    ListSortable.prototype.init = function () {
        listSortableIdCounter++;

        this.listSortableId = 'listsortable/id/' + listSortableIdCounter
    };

    ListSortable.prototype.addList = function (list) {
        this.lists.push(list);
        this.registerListHandlers(list);

        if (this.lists.length == 1) {
            $(list).one('dispose-control', this.proxy(this.dispose))
        }
    };

    //
    // Event management
    //

    ListSortable.prototype.registerListHandlers = function (list) {
        var $list = $(list);

        $list.on('dragstart', '> li', this.proxy(this.onDragStart));
        $list.on('dragover', '> li', this.proxy(this.onDragOver));
        $list.on('dragenter', '> li', this.proxy(this.onDragEnter));
        $list.on('dragleave', '> li', this.proxy(this.onDragLeave));
        $list.on('drop', '> li', this.proxy(this.onDragDrop));
        $list.on('dragend', '> li', this.proxy(this.onDragEnd))
    };

    ListSortable.prototype.unregisterListHandlers = function (list) {
        var $list = $(list);

        $list.off('dragstart', '> li', this.proxy(this.onDragStart));
        $list.off('dragover', '> li', this.proxy(this.onDragOver));
        $list.off('dragenter', '> li', this.proxy(this.onDragEnter));
        $list.off('dragleave', '> li', this.proxy(this.onDragLeave));
        $list.off('drop', '> li', this.proxy(this.onDragDrop));
        $list.off('dragend', '> li', this.proxy(this.onDragEnd))
    };

    ListSortable.prototype.unregisterHandlers = function () {
        $(document).off('dragover', this.proxy(this.onDocumentDragOver));
        $(document).off('mousemove', this.proxy(this.onDocumentMouseMove));
        $(this.lists[0]).off('dispose-control', this.proxy(this.dispose))
    };

    //
    // Disposing
    //

    ListSortable.prototype.unbindLists = function () {
        for (var i = this.lists.length - 1; i > 0; i--) {
            var list = this.lists[i];

            this.unregisterListHandlers(this.lists[i]);
            $(list).removeData('oc.listSortable')
        }
    };

    ListSortable.prototype.dispose = function () {
        this.unbindLists();
        this.unregisterHandlers();

        this.options = null;
        this.lists = [];

        BaseProto.dispose.call(this)
    };

    //
    // Internal helpers
    //

    ListSortable.prototype.elementBelongsToManagedList = function (element) {
        for (var i = this.lists.length - 1; i >= 0; i--) {
            var list = this.lists[i],
                children = [].slice.call(list.children); // Converts HTMLCollection to array

            if (children.indexOf(element) !== -1) {
                return true
            }
        }

        return false
    };

    ListSortable.prototype.isDragStartAllowed = function (element) {
        // TODO: if handle selector is specified - test if 
        // the element is a handle.

        return true
    };

    ListSortable.prototype.elementIsPlaceholder = function (element) {
        return element.getAttribute('class') === 'list-sortable-placeholder'
    };

    ListSortable.prototype.getElementSortableId = function (element) {
        if (element.hasAttribute('data-list-sortable-element-id')) {
            return element.getAttribute('data-list-sortable-element-id')
        }

        elementsIdCounter++;
        var elementId = elementsIdCounter;

        element.setAttribute('data-list-sortable-element-id', elementsIdCounter);

        return elementsIdCounter
    };

    ListSortable.prototype.dataTransferContains = function (ev, element) {
        if (ev.dataTransfer.types.indexOf !== undefined) {
            return ev.dataTransfer.types.indexOf(element) >= 0
        }

        return ev.dataTransfer.types.contains(element)
    };

    ListSortable.prototype.isSourceManagedList = function (ev) {
        return this.dataTransferContains(ev, this.listSortableId)
    };

    ListSortable.prototype.removePlaceholders = function () {
        for (var i = this.lists.length - 1; i >= 0; i--) {
            var list = this.lists[i],
                placeholders = list.querySelectorAll('.list-sortable-placeholder');

            for (var j = placeholders.length - 1; j >= 0; j--) {
                list.removeChild(placeholders[j])
            }
        }
    };

    ListSortable.prototype.createPlaceholder = function (element, ev) {
        var placeholder = document.createElement('li'),
            placement = this.getPlaceholderPlacement(element, ev);

        this.removePlaceholders();

        placeholder.setAttribute('class', 'list-sortable-placeholder');
        placeholder.setAttribute('draggable', true);

        if (placement == 'before') {
            element.parentNode.insertBefore(placeholder, element)
        }
        else {
            element.parentNode.insertBefore(placeholder, element.nextSibling)
        }
    };

    ListSortable.prototype.moveElement = function (target, ev) {
        var list = target.parentNode,
            placeholder = list.querySelector('.list-sortable-placeholder');

        if (!placeholder) {
            return
        }

        var elementId = ev.dataTransfer.getData('listsortable/elementid');
        if (!elementId) {
            return
        }

        var item = this.findDraggedItem(elementId);
        if (!item) {
            return
        }

        placeholder.parentNode.insertBefore(item, placeholder);
        $(item).trigger('dragged.list.sortable')
    };

    ListSortable.prototype.findDraggedItem = function (elementId) {
        for (var i = this.lists.length - 1; i >= 0; i--) {
            var list = this.lists[i],
                item = list.querySelector('[data-list-sortable-element-id="' + elementId + '"]');

            if (item) {
                return item
            }
        }

        return null
    };

    ListSortable.prototype.getPlaceholderPlacement = function (hoverElement, ev) {
        var mousePosition = Storm.foundation.event.pageCoordinates(ev),
            elementPosition = Storm.foundation.element.absolutePosition(hoverElement);

        if (this.options.direction == 'vertical') {
            var elementCenter = elementPosition.top + hoverElement.offsetHeight / 2;

            return mousePosition.y <= elementCenter ? 'before' : 'after'
        }
        else {
            var elementCenter = elementPosition.left + hoverElement.offsetWidth / 2;

            return mousePosition.x <= elementCenter ? 'before' : 'after'
        }
    };

    ListSortable.prototype.lastMousePositionChanged = function (ev) {
        var mousePosition = Storm.foundation.event.pageCoordinates(ev.originalEvent);

        if (this.lastMousePosition === null || this.lastMousePosition.x != mousePosition.x || this.lastMousePosition.y != mousePosition.y) {
            this.lastMousePosition = mousePosition;
            return true
        }

        return false
    };

    ListSortable.prototype.mouseOutsideLists = function (ev) {
        var mousePosition = Storm.foundation.event.pageCoordinates(ev);

        for (var i = this.lists.length - 1; i >= 0; i--) {
            if (Storm.foundation.element.elementContainsPoint(this.lists[i], mousePosition)) {
                return false
            }
        }

        return true
    };

    ListSortable.prototype.getClosestDraggableParent = function (element) {
        var current = element;

        while (current) {
            if (current.tagName === 'LI' && current.hasAttribute('draggable')) {
                return current
            }

            current = current.parentNode
        }

        return null
    };

    // EVENT HANDLERS
    // ============================

    ListSortable.prototype.onDragStart = function (ev) {
        if (!this.isDragStartAllowed(ev.target)) {
            return
        }

        ev.originalEvent.dataTransfer.effectAllowed = 'move';
        ev.originalEvent.dataTransfer.setData('listsortable/elementid', this.getElementSortableId(ev.target));
        ev.originalEvent.dataTransfer.setData(this.listSortableId, this.listSortableId);

        // The mousemove handler is used to remove the placeholder
        // when the drag is canceled with Escape button. We can't use
        // the dragend for removing the placeholders because dragend
        // is triggered before drop, but we need placeholder to exists
        // in the drop handler.
        // 
        // Mouse events are suppressed during the drag and drop operations,
        // so we only need to handle it once (but we still must the handler 
        // explicitly).
        $(document).on('mousemove', this.proxy(this.onDocumentMouseMove));

        // The dragover handler is used to hide the placeholder when
        // the mouse is outside of any known list.
        $(document).on('dragover', this.proxy(this.onDocumentDragOver))
    };

    ListSortable.prototype.onDragOver = function (ev) {
        if (!this.isSourceManagedList(ev.originalEvent)) {
            return
        }

        var draggable = this.getClosestDraggableParent(ev.target);
        if (!draggable) {
            return
        }

        if (!this.elementIsPlaceholder(draggable) && this.lastMousePositionChanged(ev)) {
            this.createPlaceholder(draggable, ev.originalEvent)
        }

        ev.stopPropagation();
        ev.preventDefault();
        ev.originalEvent.dataTransfer.dropEffect = 'move'
    };

    ListSortable.prototype.onDragEnter = function (ev) {
        if (!this.isSourceManagedList(ev.originalEvent)) {
            return
        }

        var draggable = this.getClosestDraggableParent(ev.target);
        if (!draggable) {
            return
        }

        if (this.elementIsPlaceholder(draggable)) {
            return
        }

        this.createPlaceholder(draggable, ev.originalEvent);
        ev.stopPropagation();
        ev.preventDefault()
    };

    ListSortable.prototype.onDragLeave = function (ev) {
        if (!this.isSourceManagedList(ev.originalEvent)) {
            return
        }

        ev.stopPropagation();
        ev.preventDefault()
    };

    ListSortable.prototype.onDragDrop = function (ev) {
        if (!this.isSourceManagedList(ev.originalEvent)) {
            return
        }

        var draggable = this.getClosestDraggableParent(ev.target);
        if (!draggable) {
            return
        }

        this.moveElement(draggable, ev.originalEvent);

        this.removePlaceholders()
    };

    ListSortable.prototype.onDragEnd = function (ev) {
        $(document).off('dragover', this.proxy(this.onDocumentDragOver))
    };

    ListSortable.prototype.onDocumentDragOver = function (ev) {
        if (!this.isSourceManagedList(ev.originalEvent)) {
            return
        }

        if (this.mouseOutsideLists(ev.originalEvent)) {
            this.removePlaceholders();

        }
    };

    ListSortable.prototype.onDocumentMouseMove = function (ev) {
        $(document).off('mousemove', this.proxy(this.onDocumentMouseMove));
        this.removePlaceholders()
    };


    // PLUGIN DEFINITION
    // ============================

    ListSortable.DEFAULTS = {
        handle: null,
        direction: 'vertical'
    };

    var old = $.fn.listSortable;

    $.fn.listSortable = function (option) {
        var args = arguments;

        return this.each(function () {
            var $this = $(this),
                data = $this.data('oc.listSortable'),
                options = $.extend({}, ListSortable.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) {
                $this.data('oc.listSortable', (data = new ListSortable(this, options)))
            }

            if (typeof option == 'string' && data) {
                if (data[option]) {
                    var methodArguments = Array.prototype.slice.call(args); // Clone the arguments array
                    methodArguments.shift();

                    data[option].apply(data, methodArguments)
                }
            }
        })
    };

    $.fn.listSortable.Constructor = ListSortable;

    // LISTSORTABLE NO CONFLICT
    // =================

    $.fn.listSortable.noConflict = function () {
        $.fn.listSortable = old;
        return this
    };

    $(document).on('render', function () {
        $('[data-control=list-sortable]').listSortable()
    })

}(window.jQuery);