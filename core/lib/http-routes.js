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
        async (ctx, next) => {
            if (ctx.path === "/bundle.js" || ctx.path === "/bundle.js.map") {
                return await next();
            }

            let page = (configuration.pages[ctx.request.header.host] || "default");

            if (ctx.path[ctx.path.length - 1] === "/") {
                ctx.path += "index.html";
            }

            let ext = path.extname(ctx.path);
            let filename = path.join(wwwPath, ctx.path);
            let compiledFilename = path.join(configuration.cacheDirectory, ctx.path);
            let processJs = true;
            let isIndex = false;

            if (ctx.path === "/index.html") {
                compiledFilename = path.join(configuration.cacheDirectory, page, ctx.path);
                ctx.path = path.join("/", page, "index.html");
                isIndex = true;
            }

            if (ctx.path === "/local/api.io-client.js") {
                processJs = false;
                filename = path.join(__dirname, "..", "..", "node_modules", "api.io", "browser", "api.io-client.js");
            } else if (ctx.path === "/local/socket.io-client.js") {
                processJs = false;
                filename = path.join(__dirname, "..", "..", "node_modules", "socket.io-client", "socket.io.js");
            } else if (ctx.path.includes("node_modules") ||
                ctx.path.includes("index.js")) {
                // No processing required
                processJs = false;
            }

            if (await fs.existsAsync(compiledFilename)) {
                // File already compiled

                let filestat = await fs.statAsync(filename);
                let compiledFilestat = await fs.statAsync(compiledFilename);

                if (moment(filestat.mtime).isBefore(moment(compiledFilestat.mtime))) {
                    return await next();
                }
            }

            if (!(await fs.existsAsync(filename))) {
                // File does not exist, try to serve will give error
                return await next();
            }

            if (processJs && ext === ".js") {
                let result = await babel.transformFileAsync(filename, {
                    plugins: [
                        "transform-es2015-modules-amd"
                    ]
                });

                await fs.outputFileAsync(compiledFilename, result.code);
            } else if (ext === ".css") {
                let source = await fs.readFileAsync(filename);
                let compiled = new CleanCSS({ root: wwwPath }).minify(source);

                if (compiled.errors.length > 0) {
                    throw new Error(compiled.errors);
                }

                await fs.outputFileAsync(compiledFilename, compiled.styles);
            } else if (ctx.path === "/components.html") {
                let source = await fs.readFileAsync(path.join(wwwPath, "components.html"));
                let template = hogan.compile(source.toString());
                let compiled = template.render({ components: await plugin.getComponents(wwwPath) });

                await fs.outputFileAsync(compiledFilename, compiled);
            } else if (isIndex) {
                let source = await fs.readFileAsync(filename);
                let template = hogan.compile(source.toString());
                let compiled = template.render({ GOOGLE_API_KEY: configuration.googleBrowserKey, page: page });

                await fs.outputFileAsync(compiledFilename, compiled);
            } else {
                await fs.copyAsync(filename, compiledFilename);
            }

            await gzip(compiledFilename);
            await next();
        },
        staticFile(configuration.cacheDirectory, { maxage: maxage })
    ]
};
