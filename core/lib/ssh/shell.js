"use strict";

const Terminal = require("../terminal");

class Shell {
    onSession(connection, session) {
        session.once("pty", (accept, reject, info) => this.windowChange(connection, accept, info));
        session.on("window-change", (accept, reject, info) => this.windowChange(connection, accept, info));
        session.once("shell", (accept) => this.open(connection, accept));
        session.once("close", () => this.close(connection));
    }

    windowChange(connection, accept, info) {
        if (connection.terminal) {
            connection.terminal.setSize(info.cols, info.rows);
        }

        accept && accept();
    }

    open(connection, accept) {
        const stream = accept();

        stream.rows = 24;
        stream.columns = 80;
        stream.isTTY = true;
        stream.setRawMode = () => {};

        connection.terminal = new Terminal(connection.client.session.client, stream);

        connection.terminal.initialize();
    }

    close(connection) {
        connection.terminal && connection.terminal.dispose();
        connection.terminal = null;
    }

    async stop() {}
}

module.exports = Shell;
