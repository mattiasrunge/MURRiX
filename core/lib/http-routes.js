"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const staticFile = require("koa-static");
const parse = require("co-busboy");
const CleanCSS = require("clean-css");
const promisifyAll = require("bluebird").promisifyAll;
const babel = promisifyAll(require("babel-core"));
const configuration = require("./configuration");
const store = require("./store");

const wwwPath = path.join(__dirname, "..", "..", "www");

let css;
let cssTime;

module.exports = {
    "/style.css": function*() {
        let filename = path.join(wwwPath, "style.css");
        let stat = yield fs.statAsync(filename);

        if (stat.mtime.toString() !== cssTime) {
            cssTime = stat.mtime.toString();

            let source = yield fs.readFileAsync(filename);
            let compiled = new CleanCSS({ root: wwwPath }).minify(source);

            if (compiled.errors.length > 0) {
                throw new Error(compiled.errors);
            }

            css = compiled.styles;
        }

        this.type = "text/css";
        this.body = css;
    },
    "/components.json": function*() {
        let components = [];
        let dir = path.join(wwwPath, "components");
        let items = yield fs.readdirAsync(dir);

        for (let item of items) {
            if (yield fs.isDirectoryAsync(path.join(dir, item))) {
                components.push(item);
            }
        }

        this.type = "application/json";
        this.body = JSON.stringify(components);
    },
    "post/upload/:id": function*(id) {
        if (!store.get("uploadIds", id)) {
            throw new Error("Invalid upload id");
        }

        store.unset("uploadIds", id);

        let part;
        while ((part = yield parse(this))) {
            let stream = fs.createWriteStream(path.join(configuration.uploadDirectory, id));
            part.pipe(stream);
        }

        this.type = "json";
        this.body = JSON.stringify({ status: "success" }, null, 2);
    },
    unamed: () => [
        function*(next) {
            let ext = path.extname(this.originalUrl);
            if (ext === ".js" && this.originalUrl.indexOf("node_modules") === -1 && this.originalUrl.indexOf("index.js") === -1) {
                let filename = false;

                if (!(yield fs.existsAsync(path.join(configuration.bableCompileDirectory, this.originalUrl)))) {
                    filename = path.join(wwwPath, this.originalUrl);

                    if (!(yield fs.existsAsync(filename))) {
                        filename = false;
                    }
                }

                if (filename) {
                    let result = yield babel.transformFileAsync(filename, {
                        plugins: [
                            "transform-es2015-modules-amd"
                        ]/*,
                        sourceMaps: "both",
                        sourceMapTarget: this.originalUrl + ".map"*/
                    });

                    yield fs.outputFileAsync(path.join(configuration.bableCompileDirectory, this.originalUrl), result.code);

                    //yield fs.outputFileAsync(path.join(configuration.bableCompileDirectory, this.originalUrl + ".map"), JSON.stringify(result.map));
                }
            }

            yield next;
        },
        staticFile(configuration.bableCompileDirectory),
        staticFile(wwwPath)
    ]
};
