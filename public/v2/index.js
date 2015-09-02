"use strict";

requirejs.config({
    paths: {
        text: "node_modules/requirejs-text/text",
        lib: "lib",
        components: "components",
        knockout: "node_modules/knockout/build/output/knockout-latest.debug",
        bootstrap: "node_modules/bootstrap/dist/js/bootstrap.min",
        moment: "node_modules/moment/min/moment.min",
        jquery: "node_modules/jquery/dist/jquery.min",
        slider: "node_modules/bootstrap-slider/dist/bootstrap-slider.min",
        notify: "node_modules/bootstrap-notify/bootstrap-notify.min",
        mprogress: "node_modules/mprogress/mprogress.min",
        typeahead: "node_modules/bootstrap-3-typeahead/bootstrap3-typeahead.min",
        autosize: "node_modules/autosize/dist/autosize.min"
    },
    shim: {
        bootstrap: {
            deps: ["jquery"],
            exports: "jQuery"
        },
        typeahead: {
            deps: ["jquery"],
            exports: "$"
        }
    }
});

requirejs([ "lib/main" ]);
