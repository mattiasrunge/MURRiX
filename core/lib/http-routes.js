"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const glob = require("glob-promise");
const staticFile = require("koa-static");
const stream = require("koa-stream");
const moment = require("moment");
const parse = require("co-busboy");
const CleanCSS = require("clean-css");
const promisifyAll = require("bluebird").promisifyAll;
const babel = promisifyAll(require("babel-core"));
const configuration = require("./configuration");
const mcs = require("./mcs");
const log = require("./log")(module);

const wwwPath = path.join(__dirname, "..", "..", "www");

module.exports = {
    "/components.json": function*() {
        let components = [];
        let dir = path.join(wwwPath, "components");
        let items = yield fs.readdirAsync(dir);

        for (let item of items) {
            if (yield fs.isDirectoryAsync(path.join(dir, item))) {
                components.push(item);
            }
        }

        let pattern = path.join(__dirname, "..", "..", "plugins", "**", "components");
        let list = yield glob(pattern);

        for (let name of list) {
            let items = yield fs.readdirAsync(name);
            let plugin = path.basename(path.dirname(name));

            for (let item of items) {
                if (yield fs.isDirectoryAsync(path.join(name, item))) {
                    components.push(plugin + "-" + item);
                }
            }
        }

        this.type = "application/json";
        this.body = JSON.stringify(components);
    },
    "post/upload/:id": function*(id) {
        if (!this.session.uploads || !this.session.uploads[id]) {
            throw new Error("Invalid upload id");
        }

        delete this.session.uploads[id];

        let part = yield parse(this);
        let filename = path.join(configuration.uploadDirectory, id);
        log.debug("Saving uploaded file as " + filename);

        let stream = fs.createWriteStream(filename);

        part.pipe(stream);

        yield new Promise((resolve, reject) => {
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        let metadata = yield mcs.getMetadata(filename, { noChecksums: true });

        log.debug("Uploaded file " + filename + " saved!");

        this.type = "json";
        this.body = JSON.stringify({ status: "success", metadata: metadata }, null, 2);
    },
    "/media/:name": function*(name) {
        yield stream.file(this, name, {
            root: configuration.mcsDirectory,
            allowDownload: true
        });
    },
    "/file/:name/:filename": function*(filename, name) {
        this.set("Content-disposition", "attachment; filename=" + name);
        this.body = fs.createReadStream(path.join(configuration.fileDirectory, path.basename(filename)));
    },
    unamed: () => [
        function*(next) {
            let url = this.originalUrl;

            if (url[url.length - 1] === "/") {
                url += "index.html";
            }

            let ext = path.extname(url);
            let filename = path.join(wwwPath, url);
            let compiledFilename = path.join(configuration.cacheDirectory, url);

            // Preprocess

            if (this.originalUrl.includes("node_modules") || this.originalUrl.includes("index.js")) {
                // No processing required
                return yield next;
            }

            if (this.originalUrl.indexOf("/components/") === 0) {
                let parts = this.originalUrl.match(/\/components\/(.*)\/(.*)/);
                let name = parts[1];
                let file = parts[2];

                if (!(yield fs.existsAsync(filename))) {
                    let parts = name.match(/(.*?)-(.*)/);
                    let plugin = parts[1];
                    let component = parts[2];
                    filename = path.join(__dirname, "..", "..", "plugins", plugin, "components", component, file);
                }
            }

            if (yield fs.existsAsync(compiledFilename)) {
                // File already compiled

                let filestat = yield fs.statAsync(filename);
                let compiledFilestat = yield fs.statAsync(compiledFilename);

                if (moment(filestat.mtime).isBefore(moment(compiledFilestat.mtime))) {
                    return yield next;
                }
            }

            if (!(yield fs.existsAsync(filename))) {
                // File does not exist, try to serve will give error
                return yield next;
            }


            if (ext === ".js") {
                let result = yield babel.transformFileAsync(filename, {
                    plugins: [
                        "transform-es2015-modules-amd"
                    ]
                });

                yield fs.outputFileAsync(compiledFilename, result.code);
            } else if (ext === ".css") {
                let source = yield fs.readFileAsync(filename);
                let compiled = new CleanCSS({ root: wwwPath }).minify(source);

                if (compiled.errors.length > 0) {
                    throw new Error(compiled.errors);
                }

                yield fs.outputFileAsync(compiledFilename, compiled.styles);
            } else {
                yield fs.copyAsync(filename, compiledFilename);
            }

            yield next;
        },
        staticFile(configuration.cacheDirectory),
        staticFile(wwwPath)
    ]
};
