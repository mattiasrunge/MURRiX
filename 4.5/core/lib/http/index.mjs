import { promisify } from "node:util";
import Koa from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import route from "koa-route";
import compress from "koa-compress";
import conditional from "koa-conditional-get";
import etag from "koa-etag";
import range from "koa-range";
import enableDestroy from "server-destroy";
import api from "./api.mjs";
import media from "../media/index.mjs";
import { getHandler, postHandler } from "../upload/index.mjs";
import { createLog } from "../lib/log.mjs";
import config from "../config/index.mjs";
import { COOKIE_NAME } from "./HttpClient.mjs";

const log = createLog(import.meta.url);
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
            ctx.client = httpClient ? httpClient.client : null;

            await next();
        });


        const mediaRoutes = media.routes();

        for (const mroute of mediaRoutes) {
            app.use(route[mroute.method.toLowerCase()](mroute.route, mroute.handler));
        }

        app.use(route.get("/upload", getHandler));
        app.use(route.post("/upload", postHandler));

        this.server = app.listen(config.port);
        this.server.setTimeout(0);

        enableDestroy(this.server);

        api.listen(this.server);

        log.info(`Now listening for HTTP requests on port ${config.port}`);
    }

    async stop() {
        if (this.server) {
            api.close();
            await promisify(this.server.destroy.bind(this.server))();
            this.server = null;
        }
    }
}

export default new Server();
