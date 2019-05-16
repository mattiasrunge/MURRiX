
/* global window document */

import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "lib/service-worker";
import { backend } from "lib/backend";
import session from "lib/session";
import { Root } from "components/root";

import "semantic-ui-css/semantic.css";
import "animate.css/animate.css";
import "leaflet/dist/leaflet.css";
import "styles/theme.css";

const start = async (args) => {
    await backend.connect(args);
    await session.init();

    ReactDOM.render((
        <Root />
    ), document.querySelector("#root"));

    serviceWorker.register();
};

window.addEventListener("load", () => {
    const args = {
        hostname: document.location.hostname,
        port: 8080,
        secure: document.location.protocol.includes("https")
    };

    start(args).catch((error) => {
        console.error("FATAL ERROR");
        console.error(error);
        console.error(error.stack);
    });
});
