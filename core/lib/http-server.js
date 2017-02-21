"use strict";

const path = require("path");
const fs = require("fs-extra-promise");
const http = require("http");
const promisify = require("bluebird").promisify;
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const route = require("koa-route");
const compress = require("koa-compress");
const conditional = require("koa-conditional-get");
const etag = require("koa-etag");
const enableDestroy = require("server-destroy");
const uuid = require("node-uuid");
const routes = require("./http-routes");
const api = require("api.io");
const plugin = require("./plugin");
const session = require("./session");
const log = require("./log")(module);
const send = require("koa-send");
const serve = require("koa-static");

let server;
let params = {};

module.exports = {
    init: async (config) => {
        params = config;

        const app = new Koa();
        let sessions = session.getSessions();
        let sessionMaxAge = 1000 * 60 * 60 * 24 * 7;
        let sessionName = "apiio";

        if (params.cacheDirectory) {
            await fs.removeAsync(params.cacheDirectory);
        }

        // Setup application
        app.use(compress());
        app.use(bodyParser({ enableTypes: [ "json", "form", "text" ] }));
        app.use(conditional());
        app.use(etag());

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
            ctx.session._expires = new Date(Date.now() + sessionMaxAge);

            ctx.cookies.set(sessionName, sessionId, { maxAge: sessionMaxAge });

            await next();
        });

        // Create plugin routes
        let pluginRoutes = plugin.getRoutes();

        for (let pluginRoute of pluginRoutes) {
            app.use(route[pluginRoute.method.toLowerCase()](pluginRoute.route, pluginRoute.handler));
        }

        // Create routes
        for (let name of Object.keys(routes)) {
            if (name === "unamed") {
                for (let fn of routes.unamed()) {
                    app.use(fn);
                }
            } else {
                let method = "get";
                let routeName = name;

                if (name[0] !== "/") {
                    [ , method, routeName ] = name.match(/(.+?)(\/.*)/);
                }

                app.use(route[method](routeName, routes[name]));
            }
        }

        const buildWebpackCfg = require("../../webpack.config.js");
        const webpack = require("webpack");
        const webpackMiddleware = require("koa-webpack-dev-middleware");

        const webpackCfg = buildWebpackCfg({ dev: true });
        const webpackMiddlewareConf = webpackMiddleware(webpack(webpackCfg), {
            stats: true
        });

        app.use(webpackMiddlewareConf);

        //app.use(route.get("*", async (ctx) => await send(ctx, "/index.html", { root: path.join(__dirname, "..", "..", "www") })));

        server = app.listen(params.port);

        enableDestroy(server);

        // Socket.io if we have defined API
        await api.start(server, { sessionName: sessionName, sessionMaxAge: sessionMaxAge }, sessions);

        log.info("Now listening for http request on port " + params.port);
    },
    stop: async () => {
        if (server) {
            await promisify(server.destroy, { context: server })();
        }
    }
};
