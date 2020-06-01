"use strict";

const assert = require("assert");
const { Duplex } = require("stream");

class ClientStream extends Duplex {
    constructor(options) {
        super(options);

        assert(options?.onWrite, "onWrite must be specified in options");

        this.onWrite = options.onWrite;
        this.columns = 80;
        this.rows = 24;
        this.isTTY = true;
        this.isWaiting = true;
        this.insertBuffer = "";
    }

    setRawMode() {}

    _read(size) {
        this.isWaiting = false;

        while (!this.isWaiting && this.insertBuffer.length > 0) {
            const data = this.insertBuffer.slice(0, size);
            this.insertBuffer = this.insertBuffer.slice(size);

            if (!this.push(data)) {
                this.isWaiting = true;
            }
        }
    }

    _write(chunk, encoding, callback) {
        this.onWrite(chunk.toString());
        callback();
    }

    insert(data) {
        if (this.isWaiting) {
            this.insertBuffer += data;
        } else if (!this.push(data)) {
            this.isWaiting = true;
        }
    }

    close() {}
}

module.exports = ClientStream;
