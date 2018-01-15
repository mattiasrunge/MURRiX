"use strict";

const path = require("path");
const glob = require("glob-promise");
const fs = require("fs-extra-promise");
const log = require("./log")(module);

let params = {};
const apis = {};

module.exports = {
    init: async (config) => {
        params = config;

        const pattern = path.join(__dirname, "..", "..", "plugins", "**", "api.js");
        const filenames = await glob(pattern);

        // Load API files
        for (const filename of filenames) {
            log.info(`Loading plugin from ${filename}`);

            const api = {};

            api.instance = require(filename);
            api.deps = api.instance.deps;
            api.namespace = api.instance.namespace;
            api.priority = -1;
            api.routes = [];

            const routefilenames = await glob(path.join(path.dirname(filename), "routes", "*"));

            for (const routefilename of routefilenames) {
                log.info(`Loading route from ${routefilename}`);

                const route = require(routefilename);
                route.name = path.basename(routefilename, ".js");
                route.method = route.method || "GET";
                api.routes.push(route);
            }

            apis[api.namespace] = api;
        }

        // Check for missing API dependencies
        for (const namespace of Object.keys(apis)) {
            for (const dep of apis[namespace].deps) {
                if (!apis[dep]) {
                    throw new Error(`Plugin ${namespace} specifies a dependency toward ${dep} which was not found"`);
                }
            }
        }

        // Create dependency graph for APIs
        const calcPriority = (namespace) => {
            if (apis[namespace].priority === -1) {
                if (apis[namespace].deps.length === 0) {
                    apis[namespace].priority = 0;
                } else {
                    apis[namespace].priority = Math.max(...apis[namespace].deps.map(calcPriority)) + 1;
                }
            }

            return apis[namespace].priority;
        };

        for (const namespace of Object.keys(apis)) {
            calcPriority(namespace);
        }

        // Sort based on priority
        const list = Object.keys(apis)
        .map((namespace) => apis[namespace])
        .sort((a, b) => a.priority - b.priority);

        // Intialize plugins
        for (const api of list) {
            log.info(`Initializing ${api.namespace}`);
            await api.instance.init(params);

            for (const route of api.routes) {
                await route.init(params);
            }
        }

        log.info("All plugins initialized!");
    },
    getRoutes: () => {
        const routes = [];

        for (const namespace of Object.keys(apis)) {
            for (const route of apis[namespace].routes) {
                routes.push({
                    method: route.method,
                    route: `/${namespace}/${route.name}${route.route}`,
                    handler: route.handler
                });
            }
        }

        return routes;
    },
    getComponents: async (wwwPath) => {
        const list = {};
        const components = [];

        let pattern = path.join(wwwPath, "pages", "**", "components");
        let directories = await glob(pattern);

        for (const name of directories) {
            const items = await fs.readdirAsync(name);
            const page = path.basename(path.dirname(name));

            for (const item of items) {
                const dirname = path.join(name, item);
                if (await fs.isDirectoryAsync(dirname)) {
                    list[`${page}-${item}`] = dirname;
                }
            }
        }

        pattern = path.join(__dirname, "..", "..", "plugins", "**", "components");
        directories = await glob(pattern);

        for (const name of directories) {
            const items = await fs.readdirAsync(name);
            const plugin = path.basename(path.dirname(name));

            for (const item of items) {
                const dirname = path.join(name, item);
                if (await fs.isDirectoryAsync(dirname)) {
                    list[`${plugin}-${item}`] = dirname;
                }
            }
        }

        for (const name of Object.keys(list)) {
            const component = {
                name: name,
                path: list[name]
            };

            const jsFile = path.join(component.path, "model.js");
            const htmlFile = path.join(component.path, "template.html");

            component.js = (await fs.readFileAsync(jsFile)).toString();
            component.html = (await fs.readFileAsync(htmlFile)).toString();

            if (component.js.charCodeAt(0) === 0xFEFF) {
                component.js = component.js.slice(1);
            }

            if (component.html.charCodeAt(0) === 0xFEFF) {
                component.html = component.html.slice(1);
            }

            components.push(component);
        }

        return components;
    }
};
