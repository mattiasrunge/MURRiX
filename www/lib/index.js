
/* global location window document */

import React from "react";
import ReactDOM from "react-dom";
import bluebird from "bluebird";
import Root from "components/root";

import "jquery";
import "tether";
import "bootstrap";
import "lib/extensions";
import "lib/bindings";

import "www/style.css";

import api from "api.io-client";
import session from "lib/session";

// https://github.com/petkaantonov/bluebird/issues/903
// https://github.com/babel/babel/issues/3922
// https://github.com/tj/co/pull/256#issuecomment-168475913
bluebird.config({
    warnings: false
});

const start = async (args) => {
    await api.connect(args);
    await session.loadUser();

    ReactDOM.render((
        <Root />
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
