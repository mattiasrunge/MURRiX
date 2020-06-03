"use strict";

const { Server: SSHServer } = require("sftp-fs");
const log = require("../lib/log")(module);
const configuration = require("../config");
const FileSystem = require("./FileSystem");
const Shell = require("./Shell");

class Server {
    async init() {
        this.server = new SSHServer(new FileSystem());
        this.shell = new Shell();

        this.server.on("error", (error) => log.error(error));
        this.server.on("session-open", ({ connection, session }) => {
            this.shell.onSession(connection, session);
        });

        // TODO: Generate keys if none exists
        await this.server.start(configuration.sftp.keyFile, configuration.sftp.port);

        log.info(`Now listening for SSH requests on port ${configuration.sftp.port}`);
    }

    async stop() {
        this.shell && await this.shell.stop();
        this.server && await this.server.stop();
    }
}

module.exports = new Server();
