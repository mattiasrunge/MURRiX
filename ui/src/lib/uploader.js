"use strict";

import request from "superagent";
import cookies from "browser-cookies";
import { backend, cmd } from "lib/backend";
import notification from "lib/notification";
import Emitter from "./emitter";

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
            const session = cookies.get("session"); // TODO: Wrap in backend function

            file.status = "uploading";
            this.setState({
                files: this.state.files.slice(0),
                currentFile: file
            });

            const req = await request
            .post(`${backend.getAddress()}/media/upload/${file.id}`)
            .set("session", session)
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

            await cmd.ensure(this.state.path, "d");

            const node = await cmd.create(this.state.path, "f", file.name, {
                name: file.name,
                _source: {
                    filename: req.body.filename
                }
            });

            await cmd.regenerate(node.path);

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
