"use strict";

const util = require("util");
const Koa = require("koa");
const cors = require("@koa/cors");
const bodyParser = require("koa-bodyparser");
const route = require("koa-route");
const compress = require("koa-compress");
const conditional = require("koa-conditional-get");
const etag = require("koa-etag");
const range = require("koa-range");
const enableDestroy = require("server-destroy");
const api = require("./api");
const media = require("../media");
const log = require("../log")(module);
const { COOKIE_NAME } = require("./client");

let server;
let params = {};

module.exports = {
    init: async (config) => {
        params = config;

        const app = new Koa();

        // Setup application
        app.use(compress());
        app.use(cors());
        app.use(bodyParser({ enableTypes: [ "json", "form", "text" ] }));
        app.use(conditional());
        app.use(etag());
        app.use(range);

        // Configure error handling
        app.use(async (ctx, next) => {
            try {
                await next();
            } catch (error) {
                log.error(error);
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
            const sessionCookie = ctx.cookies.get(COOKIE_NAME) || ctx.request.header[COOKIE_NAME];

            ctx.client = await api.getClientByCookie(sessionCookie);

            await next();
        });


        const mediaRoutes = media.routes();

        for (const mroute of mediaRoutes) {
            app.use(route[mroute.method.toLowerCase()](mroute.route, mroute.handler));
        }

        server = app.listen(params.port);

        enableDestroy(server);

        api.listen(server);

        log.info(`Now listening for http requests on port ${params.port}`);
    },
    stop: async () => {
        if (server) {
            api.close();
            await util.promisify(server.destroy.bind(server))();
        }
    }
};
