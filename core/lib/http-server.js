"use strict";

const fs = require("fs-extra-promise");
const path = require("path");
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
const moment = require("moment");
const configuration = require("./configuration");
const routes = require("./http-routes");
const store = require("./store");
const api = require("api.io");

let server;
let sessions = {};
let params = {};

module.exports = {
    init: co(function*(config, version) {
        params = config;

        let app = koa();

        if (params.bableCompileDirectory) {
            yield fs.removeAsync(params.bableCompileDirectory);
        }

        store.create("uploadIds");

        // Setup application
        app.name = "murrix-v" + version;
        app.keys = [ "murrix is tha best" ];
        app.use(session({ key: app.name }, app));
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
            if (typeof this.session.sessionId === "undefined") {
                this.session.sessionId = uuid.v4();
                console.log("Created session " + this.session.sessionId);
            }

            sessions[this.session.sessionId] = sessions[this.session.sessionId] || {
                sessionId: this.session.sessionId
            };

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
        yield api.start(server, app.name, sessions);

        api.on("connection", (client) => {
            client.session.uploads = client.session.uploads || {};
            client.session.allocateUploadId = () => {
                let id = uuid.v4();
                store.set("uploadIds", id, moment());
                client.session.uploads[id] = path.join(params.uploadDirectory, id);
                return id;
            };
        });

        server.listen(configuration.port);
    }),
    stop: co(function*() {
        if (server) {
            yield promisify(server.destroy, { context: server })();
        }
    })
};