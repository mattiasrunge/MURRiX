
/* global location window document */

import React from "react";
import ReactDOM from "react-dom";
import Knockout from "components/knockout";
import bluebird from "bluebird";

import "jquery";
import "tether";
import "bootstrap";
import "lib/extensions";
import "lib/bindings";

import "www/style.css";

const api = require("api.io-client");
const ui = require("lib/ui");
const session = require("lib/session");

// https://github.com/petkaantonov/bluebird/issues/903
// https://github.com/babel/babel/issues/3922
// https://github.com/tj/co/pull/256#issuecomment-168475913
bluebird.config({
    warnings: false
});


class App extends Knockout {
    getTemplate() {
        console.log("App getTemplate");

        return (
            <div data-bind="react: 'default-root'"></div>
        );
    }
}

const start = async (args) => {
    await api.connect(args);
    await session.loadUser();

    ReactDOM.render((
        <App />
    ), document.getElementById("main"));
};


window.onload = () => {
    const args = {
        hostname: location.hostname,
        port: location.port,
        secure: location.protocol.includes("https")
    };

    start(args).catch((error) => {
        console.error("FATAL ERROR");
        console.error(error);
        console.error(error.stack);
    });
};
