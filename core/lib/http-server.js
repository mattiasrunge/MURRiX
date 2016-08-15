"use strict";

const fs = require("fs-extra-promise");
const http = require("http");
const co = require("bluebird").coroutine;
const promisify = require("bluebird").promisify;
const koa = require("koa.io");
const bodyParser = require("koa-bodyparser");
const route = require("koa-route");
const compress = require("koa-compress");
const session = require("koa-session");
const conditional = require("koa-conditional-get");
const etag = require("koa-etag");
const enableDestroy = require("server-destroy");
const uuid = require("node-uuid");
const configuration = require("./configuration");
const routes = require("./http-routes");
const api = require("api.io");
const sessionStore = require("./session");
const log = require("./log")(module);

let server;
let params = {};

module.exports = {
    init: co(function*(config) {
        params = config;

        let app = koa();
        let sessions = sessionStore.getSessions();

        if (params.cacheDirectory) {
            yield fs.removeAsync(params.cacheDirectory);
        }

        // Setup application
        app.keys = [ "murrix is tha best" ];
        app.use(session({ key: "api.io-authorization", maxAge: 24 * 60 * 60 * 1000 * 30 }, app));
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
        app.use(function *(next) {
            if (!this.session.sessionId) {
                this.session.sessionId = uuid.v4();
                log.info("Created session for a browser, id " + this.session.sessionId);
            }

            if (!sessions[this.session.sessionId]) {
                sessions[this.session.sessionId] = {
                    sessionId: this.session.sessionId
                };
            }

            this.sessionData = sessions[this.session.sessionId];

            yield next;
        });

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
        yield api.start(server, sessions);

        server.listen(configuration.port);
    }),
    stop: co(function*() {
        if (server) {
            yield promisify(server.destroy, { context: server })();
        }
    })
};
