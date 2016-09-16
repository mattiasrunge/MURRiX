"use strict";

const path = require("path");
const glob = require("glob-promise");
const fs = require("fs-extra-promise");
const co = require("bluebird").coroutine;
const log = require("./log")(module);

let params = {};
let apis = {};

module.exports = {
    init: co(function*(config) {
        params = config;

        let pattern = path.join(__dirname, "..", "..", "plugins", "**", "api.js");
        let filenames = yield glob(pattern);

        // Load API files
        for (let filename of filenames) {
            log.info("Loading plugin from " + filename);

            let api = {};

            api.instance = require(filename);
            api.deps = api.instance.deps;
            api.namespace = api.instance.namespace;
            api.priority = -1;
            api.routes = [];

            let routefilenames = yield glob(path.join(path.dirname(filename), "routes", "*"));

            for (let routefilename of routefilenames) {
                log.info("Loading route from " + routefilename);

                let route = require(routefilename);
                route.name = path.basename(routefilename, ".js");
                route.method = route.method || "GET";
                api.routes.push(route);
            }

            apis[api.namespace] = api;
        }

        // Check for missing API dependencies
        for (let namespace of Object.keys(apis)) {
            for (let dep of apis[namespace].deps) {
                if (!apis[dep]) {
                    throw new Error("Plugin " + namespace + " specifies a dependency toward " + dep + " which was not found");
                }
            }
        }

        // Create dependency graph for APIs
        const calcPriority = (namespace) => {
            if (apis[namespace].priority === -1) {
                if (apis[namespace].deps.length === 0) {
                    apis[namespace].priority = 0;
                } else {
                    apis[namespace].priority = Math.max.apply(Math, apis[namespace].deps.map(calcPriority)) + 1;
                }
            }

            return apis[namespace].priority;
        };

        for (let namespace of Object.keys(apis)) {
            calcPriority(namespace);
        }

        // Sort based on priority
        let list = Object.keys(apis)
        .map((namespace) => apis[namespace])
        .sort((a, b) => a.priority - b.priority);

        // Intialize plugins
        for (let api of list) {
            log.info("Initializing " + api.namespace);
            yield api.instance.init(params);

            for (let route of api.routes) {
                yield route.init(params);
            }
        }

        log.info("All plugins initialized!");
    }),
    getRoutes: () => {
        let routes = [];

        for (let namespace of Object.keys(apis)) {
            for (let route of apis[namespace].routes) {
                routes.push({
                    method: route.method,
                    route: "/" + namespace + "/" + route.name + route.route,
                    handler: route.handler
                });
            }
        }

        return routes;
    },
    getComponents: co(function*(wwwPath) {
        let list = {};
        let components = [];

        let pattern = path.join(wwwPath, "pages", "**", "components");
        let directories = yield glob(pattern);

        for (let name of directories) {
            let items = yield fs.readdirAsync(name);
            let page = path.basename(path.dirname(name));

            for (let item of items) {
                let dirname = path.join(name, item);
                if (yield fs.isDirectoryAsync(dirname)) {
                    list[page + "-" + item] = dirname;
                }
            }
        }

        pattern = path.join(__dirname, "..", "..", "plugins", "**", "components");
        directories = yield glob(pattern);

        for (let name of directories) {
            let items = yield fs.readdirAsync(name);
            let plugin = path.basename(path.dirname(name));

            for (let item of items) {
                let dirname = path.join(name, item);
                if (yield fs.isDirectoryAsync(dirname)) {
                    list[plugin + "-" + item] = dirname;

                }
            }
        }

        for (let name of Object.keys(list)) {
            let component = {
                name: name,
                path: list[name]
            };
            let jsFile = path.join(component.path, "model.js");
            let htmlFile = path.join(component.path, "template.html");

            component.js = (yield fs.readFileAsync(jsFile)).toString();
            component.html = (yield fs.readFileAsync(htmlFile)).toString();

            if (component.js.charCodeAt(0) === 0xFEFF) {
                component.js = component.js.slice(1);
            }

            if (component.html.charCodeAt(0) === 0xFEFF) {
                component.html = component.html.slice(1);
            }

            components.push(component);
        }

        return components;
    })
};
