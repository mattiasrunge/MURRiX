"use strict";

const { Server } = require("sftp-fs");
const FS = require("./fs");
const log = require("../log")(module);

class SFTPServer {
    constructor() {
        this.tasks = [];
    }

    async init(config) {
        this.server = new Server(new FS());

        this.server.on("client-connected", () => log.info("Client connected!"));
        this.server.on("client-disconnected", () => log.info("Client disconnected!"));
        this.server.on("error", (error) => log.error(error));

        await this.server.start(config.sftp.keyFile, config.sftp.port);
    }

    async stop() {
        await this.server.stop();
    }
}

module.exports = new SFTPServer();
