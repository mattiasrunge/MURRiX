
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

const start = async () => {
    await backend.connect(process.env.REACT_APP_BACKEND_URL);
    await session.init();

    ReactDOM.render((
        <Root />
    ), document.querySelector("#root"));

    serviceWorker.register();
};

window.addEventListener("load", async () => {
    try {
        if (!process.env.REACT_APP_BACKEND_URL) {
            throw new Error("REACT_APP_BACKEND_ÙRL must be set");
        }

        await start();
    } catch (error) {
        console.error("FATAL ERROR");
        console.error(error);
        console.error(error.stack);
    }
});
