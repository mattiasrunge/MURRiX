"use strict";

const path = require("path");
const http = require("http");
const co = require("bluebird").coroutine;
const promisify = require("bluebird").promisify;
const koa = require("koa.io");
const bodyParser = require("koa-bodyparser");
const route = require("koa-route");
const compress = require("koa-compress");
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
let params = {};

module.exports = {
    init: co(function*(config, version) {
        let app = koa();

        params = config;

        store.create("uploadIds");

        // Setup application
        app.name = "murrix-v" + version;
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
        yield api.start(server);

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
