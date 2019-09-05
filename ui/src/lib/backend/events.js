
import cookies from "browser-cookies";
import Emitter from "../emitter";

class Events extends Emitter {
    constructor(backend) {
        super();

        backend.on("message", async (event, message) => {
            if (message.id) {
                return;
            }

            if (message.event === "set-cookie") {
                cookies.set(message.data.name, message.data.value, { domain: document.location.toString().replace(/^(?:https?:\/\/)?(?:[^\/]+\.)?([^.\/]+\.[^.\/]+).*$/, "$1") });
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
