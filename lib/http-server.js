"use strict";

const path = require("path");
const fs = require("fs-extra");
const promisify = require("bluebird").promisify;

const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const route = require("koa-route");
const compress = require("koa-compress");
const conditional = require("koa-conditional-get");
const etag = require("koa-etag");
const range = require("koa-range");
const serve = require("koa-static");

const enableDestroy = require("server-destroy");
const uuid = require("uuid");
const webpack = require("webpack");
const webpackMiddleware = require("koa-webpack-dev-middleware");
const api = require("api.io");

const media = require("./media");
const session = require("./session");
const log = require("./log")(module);


const buildWebpackCfg = require("../www/webpack.config.js");


let server;
let params = {};

module.exports = {
    init: async (config) => {
        params = config;

        const app = new Koa();
        const sessions = session.getSessions();
        const sessionMaxAge = 1000 * 60 * 60 * 24 * 7;
        const sessionName = "apiio";
        const staticPaths = [
            path.join(__dirname, "..", "node_modules", "semantic-ui-css"),
            path.join(__dirname, "..", "www", "pages", "default", "static")
        ];

        // Setup application
        app.use(compress());
        app.use(bodyParser({ enableTypes: [ "json", "form", "text" ] }));
        app.use(conditional());
        app.use(etag());
        app.use(range);

        // Configure error handling
        app.use(async (ctx, next) => {
            try {
                await next();
            } catch (error) {
                console.error(error);
                ctx.status = error.status || 500;
                ctx.type = "json";
                ctx.body = JSON.stringify({
                    result: "fail",
                    error: error.message || error,
                    status: ctx.status
                }, null, 2);
            }
        });

        // Configure sessions
        app.use(async (ctx, next) => {
            let sessionId = false;

            try {
                sessionId = ctx.cookies.get(sessionName);
            } catch (e) {
            }

            if (!sessionId || !sessions[sessionId]) {
                sessionId = uuid.v4();

                sessions[sessionId] = {
                    _id: sessionId
                };
            }

            ctx.session = sessions[sessionId];
            ctx.session._expires = ctx.session._expires || new Date(Date.now() + sessionMaxAge);

            ctx.cookies.set(sessionName, sessionId, { maxAge: sessionMaxAge });

            await next();
        });

        for (const staticPath of staticPaths) {
            app.use(serve(staticPath));
        }

        app.use(async (ctx, next) => {
            if (ctx.path !== "/") {
                return next();
            }

            ctx.type = "text/html; charset=utf-8";
            ctx.body = fs.createReadStream(path.join(__dirname, "..", "www", "index.html"));
        });

        const mediaRoutes = media.routes();

        for (const mroute of mediaRoutes) {
            app.use(route[mroute.method.toLowerCase()](mroute.route, mroute.handler));
        }

        log.info(`Webpack is running in ${config.production ? "production" : "development"} mode`);

        const webpackCfg = await buildWebpackCfg({
            dev: !config.production,
            configuration: {
                googleBrowserKey: config.googleBrowserKey
            }
        });
        const webpackMiddlewareConf = webpackMiddleware(webpack(webpackCfg), {
            stats: {
                colors: true
            }
        });

        app.use(webpackMiddlewareConf);

        app.use(route.get("*", async (ctx) => {
            ctx.type = "text/html; charset=utf-8";
            ctx.body = fs.createReadStream(path.join(__dirname, "..", "www", "index.html"));
        }));

        // app.use(route.get("*", async (ctx) => await send(ctx, "/index.html", { root: path.join(__dirname, "..", "..", "www") })));

        server = app.listen(params.port);

        enableDestroy(server);

        // Socket.io if we have defined API
        await api.start(server, { sessionName: sessionName, sessionMaxAge: sessionMaxAge }, sessions);

        log.info(`Now listening for http request on port ${params.port}`);
    },
    stop: async () => {
        if (server) {
            await promisify(server.destroy, { context: server })();
        }
    }
};