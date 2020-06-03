"use strict";

const { Server: SSHServer } = require("sftp-fs");
const log = require("../lib/log")(module);
const FS = require("./fs");
const Shell = require("./shell");

class Server {
    async init(config) {
        this.server = new SSHServer(new FS());
        this.shell = new Shell();

        this.server.on("error", (error) => log.error(error));
        this.server.on("session-open", ({ connection, session }) => {
            this.shell.onSession(connection, session);
        });

        await this.server.start(config.sftp.keyFile, config.sftp.port);

        log.info(`Now listening for SSH requests on port ${config.sftp.port}`);
    }

    async stop() {
        this.shell && await this.shell.stop();
        this.server && await this.server.stop();
    }
}

module.exports = new Server();
