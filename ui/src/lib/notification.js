"use strict";

import Emitter from "./emitter";

class Notification extends Emitter {
    constructor() {
        super();

        this.messages = [];
    }

    add(type, message, timeout = 3000) {
        this.emit("message", {
            message,
            key: Date.now(),
            dismissAfter: timeout
        });
    }
}

export default new Notification();
