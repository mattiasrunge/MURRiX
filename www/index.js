"use strict";

require.config({
    baseUrl: ".",
    paths: {
        jquery: "node_modules/jquery/dist/jquery.min",
        knockout: "node_modules/knockout/build/output/knockout-latest",
        bootstrap: "node_modules/bootstrap/dist/js/bootstrap.min",
        typeahead: "node_modules/corejs-typeahead/dist/typeahead.jquery",
        slider: "node_modules/bootstrap-slider/dist/bootstrap-slider.min",
        moment: "node_modules/moment/min/moment.min",
        "moment-duration-format": "node_modules/moment-duration-format/lib/moment-duration-format",
        "moment-timezone": "node_modules/moment-timezone/builds/moment-timezone.min",
        snackbar: "node_modules/snackbarjs/dist/snackbar.min",
        autosize: "node_modules/autosize/dist/autosize.min",
        lazyload: "node_modules/vanilla-lazyload/dist/lazyload",
        "jquery.imgareaselect": "node_modules/jdomizio-imgareaselect/jquery.imgareaselect.dev",
        "contextmenu": "node_modules/jquery-contextmenu/dist/jquery.contextMenu.min",
        chron: "node_modules/chron-time/browser/index",
        dragula: "node_modules/dragula/dist/dragula.min",
        chart: "node_modules/chart.js/dist/Chart.min",
        "socket.io-client": "local/socket.io-client",
        "api.io-client": "local/api.io-client",
        "co": "local/co"
    },
    shim: {
        bootstrap: {
            deps: [ "jquery" ]
        },
        typeahead: {
            deps: [ "jquery" ]
        },
        snackbar: {
            deps: [ "jquery" ]
        },
        contextmenu: {
            deps: [ "jquery" ]
        },
        slider: {
            deps: [ "jquery" ]
        },
        "jquery.imgareaselect": {
            deps: [ "jquery" ]
        },
        chart: {
            deps: [ "moment" ]
        },
        "moment-duration-format": {
            deps: [ "moment" ]
        },
        "moment-timezone": {
            deps: [ "moment" ]
        },
        "chron": {
            deps: [ "moment-timezone" ]
        }
    }
});

define([
    "jquery",
    "knockout",
    "bootstrap",
    "typeahead",
    "slider",
    "moment",
    "moment-duration-format",
    "moment-timezone",
    "snackbar",
    "autosize",
    "lazyload",
    "jquery.imgareaselect",
    "contextmenu",
    "chron",
    "dragula",
    "chart",
    "co",
    "socket.io-client",
    "api.io-client",
    "lib/component",
    "lib/main",
    "components"
], () => {
    const main = require("lib/main");
    const args = {
        hostname: location.hostname,
        port: location.port,
        secure: location.protocol.includes("https")
    };

    main.start(args)
    .catch((error) => {
        console.error("FATAL ERROR");
        console.error(error);
        console.error(error.stack);
    });
});
