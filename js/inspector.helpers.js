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