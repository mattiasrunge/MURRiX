"use strict";

var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

if (!isChrome) {
    document.getElementById("browserWarning").className = "";
} else {
    require.config({
        baseUrl: ".",
        paths: {
            text: "node_modules/requirejs-text/text",
            json: "node_modules/requirejs-json/json",
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
            "socket.io-client": "/socket.io/socket.io",
            "api.io-client": "/api.io/api.io-client",
            "co": "/api.io/co"
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

    define([ "lib/main" ], (main) => {
        let args = {
            hostname: location.hostname,
            port: location.port,
            secure: secure: location.protocol.includes("https")
        };

        main.start(args)
        .catch((error) => {
            console.error("FATAL ERROR");
            console.error(error);
            console.error(error.stack);
        });
    });
}
