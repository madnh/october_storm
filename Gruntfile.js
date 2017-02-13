module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');

    //Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            stormDepends: {
                src: [
                    'vendor/mustache.js/mustache.js',
                    'lib/modernizr-build.js',
                    'vendor/bootstrap/js/dropdown.js',
                    'vendor/bootstrap/js/transition.js',
                    'vendor/bootstrap/js/tab.js',
                    'vendor/bootstrap/js/modal.js',
                    'vendor/bootstrap/js/tooltip.js',
                    'vendor/raphael/raphael.js',
                    'vendor/Flot/excanvas.js',
                    'vendor/select2/dist/js/select2.full.js',
                    'vendor/jquery-mousewheel/jquery.mousewheel.js',
                    'vendor/jquery-sortable/source/js/jquery-sortable.js',
                    'vendor/moment/min/moment-with-locales.js',
                    'vendor/moment-timezone/builds/moment-timezone-with-data.js',
                    'vendor/pikaday/pikaday.js',
                    'vendor/pikaday/plugins/pikaday.jquery.js',
                    'vendor/clockpicker/dist/jquery-clockpicker.js'
                ],
                dest: 'depends.js'
            },
            storm: {
                src: [
                    'js/foundation.baseclass.js',
                    'js/foundation.element.js',
                    'js/foundation.event.js',
                    'js/foundation.controlutils.js',
                    'js/flashmessage.js',
                    'js/checkbox.js',
                    'js/checkbox.balloon.js',
                    'js/dropdown.js',
                    'js/callout.js',
                    'js/datepicker.js',
                    'js/tooltip.js',
                    'js/toolbar.js',
                    'js/filter.js',
                    'js/filter.dates.js',
                    'js/select.js',
                    'js/loader.base.js',
                    'js/loader.cursor.js',
                    'js/loader.stripe.js',
                    'js/popover.js',
                    'js/popup.js',
                    'js/chart.utils.js',
                    'js/chart.line.js',
                    'js/chart.bar.js',
                    'js/chart.pie.js',
                    'js/chart.meter.js',
                    'js/list.rowlink.js',
                    'js/input.monitor.js',
                    'js/input.hotkey.js',
                    'js/input.preset.js',
                    'js/input.trigger.js',
                    'js/drag.value.js',
                    'js/drag.sort.js',
                    'js/drag.scroll.js',
                    'js/tab.js',
                    'js/inspector.surface.js',
                    'js/inspector.manager.js',
                    'js/inspector.wrapper.base.js',
                    'js/inspector.wrapper.popup.js',
                    'js/inspector.wrapper.container.js',
                    'js/inspector.groups.js',
                    'js/inspector.engine.js',
                    'js/inspector.editor.base.js',
                    'js/inspector.editor.string.js',
                    'js/inspector.editor.checkbox.js',
                    'js/inspector.editor.dropdown.js',
                    'js/inspector.editor.popupbase.js',
                    'js/inspector.editor.text.js',
                    'js/inspector.editor.set.js',
                    'js/inspector.editor.objectlist.js',
                    'js/inspector.editor.object.js',
                    'js/inspector.editor.stringlist.js',
                    'js/inspector.editor.stringlistautocomplete.js',
                    'js/inspector.editor.dictionary.js',
                    'js/inspector.editor.autocomplete.js',
                    'js/inspector.helpers.js',
                    'js/inspector.validationset.js',
                    'js/inspector.validator.base.js',
                    'js/inspector.validator.basenumber.js',
                    'js/inspector.validator.required.js',
                    'js/inspector.validator.regex.js',
                    'js/inspector.validator.integer.js',
                    'js/inspector.validator.float.js',
                    'js/inspector.validator.length.js',
                    'js/inspector.externalparametereditor.js',
                    'js/list.sortable.js'
                ],
                dest: 'storm.js'
            },
            stormWithDepends: {
                src: [
                    'depends.js',
                    'dstorm.js'
                ],
                dest: 'storm_with_depend.js'
            }
        },
        less: {
            default: {
                options: {
                    compress: false
                },
                files: {
                    'storm.css': 'storm.less'
                }
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                ext: '.min.js'
            },
            depends: {
                src: 'depends.js',
                dest: 'depends.min.js'
            },
            storm: {
                src: 'storm.js',
                dest: 'storm.min.js'
            },
            stormWithDepend: {
                src: 'storm_with_depend.js',
                dest: 'storm_with_depend.min.js'
            }
        }
    });


    grunt.registerTask('build', ['concat', 'uglify', 'less']);
    grunt.registerTask('default', ['build']);
};