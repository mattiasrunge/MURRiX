"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const glob = require("glob-promise");
const staticFile = require("koa-static");
const moment = require("moment");
const CleanCSS = require("clean-css");
const promisifyAll = require("bluebird").promisifyAll;
const babel = promisifyAll(require("babel-core"));
const configuration = require("./configuration");

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

            if (this.originalUrl.startsWith("/components/")) {
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
