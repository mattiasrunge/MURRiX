"use strict";

require.config({
    baseUrl: ".",
    paths: {
        text: "node_modules/requirejs-text/text",
        json: "node_modules/requirejs-json/json",
        jquery: "node_modules/jquery/dist/jquery.min",
        knockout: "node_modules/knockout/build/output/knockout-latest",
        bootstrap: "node_modules/bootstrap/dist/js/bootstrap.min",
        typeahead: "node_modules/corejs-typeahead/dist/typeahead.jquery",
        mprogress: "node_modules/mprogress/build/js/mprogress.min",
        moment: "node_modules/moment/min/moment.min",
        snackbar: "node_modules/snackbarjs/dist/snackbar.min",
        autosize: "node_modules/autosize/dist/autosize.min",
        lazyload: "node_modules/vanilla-lazyload/dist/lazyload",
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
        }
    }
});

define([ "lib/main" ], (main) => {
    let args = {
        hostname: location.hostname,
        port: location.port
    };

    main.start(args)
    .catch((error) => {
        console.error("FATAL ERROR");
        console.error(error);
        console.error(error.stack);
    });
});
