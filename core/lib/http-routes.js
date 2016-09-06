"use strict";

const path = require("path");
const zlib = require("zlib");
const fs = require("fs-extra-promise");
const glob = require("glob-promise");
const staticFile = require("koa-static");
const moment = require("moment");
const CleanCSS = require("clean-css");
const promisifyAll = require("bluebird").promisifyAll;
const babel = promisifyAll(require("babel-core"));
const configuration = require("./configuration");

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
            let processJs = true;

            if (this.originalUrl.includes("node_modules") || this.originalUrl.includes("index.js")) {
                // No processing required
                processJs = false;
            }

            if (this.originalUrl.startsWith("/components/")) {
                if (!(yield fs.existsAsync(filename))) {
                    let [ , name, file ] = this.originalUrl.match(/\/components\/(.*)\/(.*)/);
                    let [ , plugin, component ] = name.match(/(.*?)-(.*)/);
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
            } else if (url === "/index.html") {
                let source = yield fs.readFileAsync(filename);
                let compiled = source.toString().replace("GOOGLE_API_KEY", configuration.googleBrowserKey);

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
