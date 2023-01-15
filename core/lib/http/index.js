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
const dropbox = require("../lib/dropbox");
const upload = require("../upload");
const log = require("../lib/log")(module);
const configuration = require("../config");
const { COOKIE_NAME } = require("./HttpClient");

class Server {
    constructor() {
        this.server = null;
    }

    async init() {
        const app = new Koa();

        app.on("error", (error) => {
            log.error("HTTP server encountered an error", error);
        });

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
                log.error("HTTP server got error while processing", error);
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
            const sessionId = ctx.cookies.get(COOKIE_NAME) || ctx.request.header[COOKIE_NAME];

            const httpClient = await api.getClientById(sessionId);
            ctx.client = httpClient.client;

            await next();
        });


        const mediaRoutes = media.routes();

        for (const mroute of mediaRoutes) {
            app.use(route[mroute.method.toLowerCase()](mroute.route, mroute.handler));
        }

        app.use(route.get("/dropbox", dropbox.handler));
        app.use(route.get("/upload", upload.getHandler));
        app.use(route.post("/upload", upload.postHandler));

        this.server = app.listen(configuration.port);
        this.server.setTimeout(0);

        enableDestroy(this.server);

        api.listen(this.server);

        log.info(`Now listening for HTTP requests on port ${configuration.port}`);
    }

    async stop() {
        if (this.server) {
            api.close();
            await util.promisify(this.server.destroy.bind(this.server))();
            this.server = null;
        }
    }
}

module.exports = new Server();
