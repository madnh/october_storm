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