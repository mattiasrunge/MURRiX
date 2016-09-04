"use strict";

const fs = require("fs-extra-promise");
const http = require("http");
const co = require("bluebird").coroutine;
const promisify = require("bluebird").promisify;
const koa = require("koa");
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

let server;
let params = {};

module.exports = {
    init: co(function*(config) {
        params = config;

        let app = koa();
        let sessions = session.getSessions();
        let sessionMaxAge = 1000 * 60 * 60 * 24 * 7;
        let sessionName = "api.io-authorization";

        if (params.cacheDirectory) {
            yield fs.removeAsync(params.cacheDirectory);
        }

        // Setup application
        app.use(compress());
        app.use(bodyParser());
        app.use(conditional());
        app.use(etag());

        // Configure error handling
        app.use(function*(next) {
            try {
                yield next;
            } catch (error) {
                console.error(error);
                console.error(error.stack);
                this.response.status = error.status || 500;
                this.type = "text/plain";
                this.body = error.message || error;
            }
        });

        // Configure sessions
        app.use(function*(next) {
            let sessionId = false;

            try {
                let cookieString = this.cookies.get(sessionName);
                let body = new Buffer(cookieString, "base64").toString("utf8");
                let cookieData = JSON.parse(body);

                if (cookieData && cookieData.sessionId) {
                    sessionId = cookieData.sessionId;
                }
            } catch (e) {
            }

            if (!sessionId || !sessions[sessionId]) {
                sessionId = uuid.v4();

                sessions[sessionId] = {
                    _id: sessionId
                };
            }

            this.session = sessions[sessionId];
            this.session._expires = new Date(Date.now() + sessionMaxAge);

            let body = JSON.stringify({ sessionId: sessionId });
            let cookieString = new Buffer(body).toString("base64");

            this.cookies.set(sessionName, cookieString, { maxAge: sessionMaxAge });

            yield next;
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
                    let parts = name.match(/(.+?)(\/.*)/);
                    method = parts[1];
                    routeName = parts[2];
                }

                app.use(route[method](routeName, routes[name]));
            }
        }

        // This must come after last app.use()
        server = http.Server(app.callback());

        enableDestroy(server);

        // Socket.io if we have defined API
        yield api.start(server, { sessionName: sessionName, sessionMaxAge: sessionMaxAge }, sessions);

        server.listen(params.port);

        log.info("Now listening for http request on port " + params.port);
    }),
    stop: co(function*() {
        if (server) {
            yield promisify(server.destroy, { context: server })();
        }
    })
};
