"use strict";

import api from "api.io/api.io-client";
import Emitter from "./emitter";
import notification from "lib/notification";
import request from "superagent";

class Uploader extends Emitter {
    constructor() {
        super();

        this.state = {
            files: [],
            ongoing: false,
            path: false,
            currentFile: 0,
            progress: 0
        };
    }

    setState(state) {
        let updated = false;

        for (const key of Object.keys(state)) {
            updated = updated || this.state[key] !== state[key];
            this.state[key] = state[key];
        }

        updated && this.emit("state", this.state);
    }

    getState() {
        return this.state;
    }

    isPathAllowed(path) {
        return !this.state.path || this.state.path === path;
    }

    addFiles(path, files) {
        if (this._ongoing || !this.isPathAllowed(path)) {
            throw new Error("Can no add more files when upload is in progress");
        }

        const newFiles = files.map((file, index) => ({
            file,
            id: `${Date.now()}__${index}`,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.preview,
            status: "queued"
        }));

        this.setState({
            files: this.state.files.concat(newFiles).slice(0),
            path
        });
    }

    async _uploadFile(file) {
        try {
            file.status = "uploading";
            this.setState({
                files: this.state.files.slice(0),
                currentFile: file
            });

            const req = await request
            .post(`/media/upload/${file.id}`)
            .attach("file", file.file)
            .on("progress", (event) => {
                if (event.direction === "upload") {
                    this.setState({ progress: Math.ceil(event.percent) });
                }
            });

            if (req.body.status !== "success") {
                throw new Error(req.body.status);
            }

            file.status = "importing";
            this.setState({ files: this.state.files.slice(0) });

            const node = await api.vfs.create(this.state.path, "f", file.name, {
                name: file.name,
                _source: {
                    filename: req.body.filename
                }
            });

            await api.vfs.regenerate(node.path);

            file.status = "complete";
            this.setState({ files: this.state.files.slice(0) });
        } catch (error) {
            file.error = error.message;
            file.status = "error";
            throw error;
        }
    }

    clear() {
        this.setState({ files: [], currentFile: false, progress: 0 });
    }

    async start() {
        this.setState({ ongoing: true });

        try {
            for (let n = 0; n < this.state.files.length; n++) {
                if (this.state.files[n].status !== "queued") {
                    continue;
                }

                await this._uploadFile(this.state.files[n]);
            }

            this.setState({ files: [], ongoing: false, currentFile: false, progress: 0 });
        } catch (error) {
            notification.add("error", error.message, 10000);
            this.setState({ files: this.state.files.slice(0), ongoing: false, currentFile: false, progress: 0 });
        }
    }
}

export default new Uploader();
