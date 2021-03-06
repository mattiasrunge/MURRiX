
/* global document */

import cookies from "browser-cookies";
import Emitter from "../emitter";

class Events extends Emitter {
    constructor(backend) {
        super();

        backend.on("message", async (event, message) => {
            if (message.type !== "event") {
                return;
            }

            if (message.event === "set-cookie") {
                const location = document.location.toString();
                const domain = location.startsWith("http://localhost") ? "localhost" : location.toString().replace(/^(?:https?:\/\/)?(?:[^/]+\.)?([^./]+\.[^./]+).*$/, "$1");

                cookies.set(message.data.name, message.data.value, { domain });
            } else if (message.event === "ready") {
                backend.onReady();
            } else {
                await this.emit(message.event, message.data);
            }

            console.log("event", message);
        });
    }
}

export default Events;
