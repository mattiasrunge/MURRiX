"use strict";

const path = require("path");
const zlib = require("zlib");
const fs = require("fs-extra-promise");
const staticFile = require("koa-static");
const moment = require("moment");
const hogan = require("hogan.js");
const CleanCSS = require("clean-css");
const promisifyAll = require("bluebird").promisifyAll;
const babel = promisifyAll(require("babel-core"));
const configuration = require("./configuration");
const plugin = require("./plugin");

const wwwPath = path.join(__dirname, "..", "..", "www");
const maxage = 3600 * 1000 * 60;

const gzip = (filename) => {
    return new Promise((resolve, reject) => {
        let rstream = fs.createReadStream(filename);
        let wstream = fs.createWriteStream(filename + ".gz");

        let pipe = rstream
        .pipe(zlib.createGzip())
        .pipe(wstream);
        pipe.on("error", reject);
        pipe.on("finish", resolve);
    });
};

module.exports = {
    unamed: () => [
        function*(next) {
            let page = (configuration.pages[this.request.header.host] || "default");

            if (this.path[this.path.length - 1] === "/") {
                this.path += "index.html";
            }

            let ext = path.extname(this.path);
            let filename = path.join(wwwPath, this.path);
            let compiledFilename = path.join(configuration.cacheDirectory, this.path);
            let processJs = true;
            let isIndex = false;

            if (this.path === "/index.html") {
                compiledFilename = path.join(configuration.cacheDirectory, page, this.path);
                this.path = path.join("/", page, "index.html");
                isIndex = true;
            }

            if (this.path === "/local/api.io-client.js") {
                processJs = false;
                filename = path.join(__dirname, "..", "..", "node_modules", "api.io", "browser", "api.io-client.js");
            } else if (this.path === "/local/co.js") {
                processJs = false;
                filename = path.join(__dirname, "..", "..", "node_modules", "api.io", "browser", "co.js");
            } else if (this.path === "/local/socket.io-client.js") {
                processJs = false;
                filename = path.join(__dirname, "..", "..", "node_modules", "socket.io-client", "socket.io.js");
            } else if (this.path.includes("node_modules") ||
                this.path.includes("index.js")) {
                // No processing required
                processJs = false;
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

            if (processJs && ext === ".js") {
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
            } else if (this.path === "/components.html") {
                let source = yield fs.readFileAsync(path.join(wwwPath, "components.html"));
                let template = hogan.compile(source.toString());
                let compiled = template.render({ components: yield plugin.getComponents(wwwPath) });

                yield fs.outputFileAsync(compiledFilename, compiled);
            } else if (isIndex) {
                let source = yield fs.readFileAsync(filename);
                let template = hogan.compile(source.toString());
                let compiled = template.render({ GOOGLE_API_KEY: configuration.googleBrowserKey, page: page });

                yield fs.outputFileAsync(compiledFilename, compiled);
            } else {
                yield fs.copyAsync(filename, compiledFilename);
            }

            yield gzip(compiledFilename);
            yield next;
        },
        staticFile(configuration.cacheDirectory, { maxage: maxage })
    ]
};
