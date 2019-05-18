
/* global window document fetch */

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

const start = async () => {
    const response = await fetch("/backend.txt");
    const url = await response.text();

    await backend.connect(url.replace(/\n/g, ""));
    await session.init();

    ReactDOM.render((
        <Root />
    ), document.querySelector("#root"));

    serviceWorker.register();
};

window.addEventListener("load", async () => {
    try {
        await start();
    } catch (error) {
        console.error("FATAL ERROR");
        console.error(error);
        console.error(error.stack);
    }
});
