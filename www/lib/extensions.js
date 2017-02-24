"use strict";

import React from "react";
import ReactDOM from "react-dom";
import components from "lib/components";

const ko = require("knockout");
const api = require("api.io/api.io-client");
const stat = require("lib/status");
const utils = require("lib/utils");

ko.bindingHandlers.react = {
    init: () => {
        return { controlsDescendantBindings: true };
    },
    update: (element, valueAccessor) => {
        const data = ko.unwrap(valueAccessor());
        const { name, params } = typeof data === "object" ? data : { name: data, params: {} };
        const Component = components[ko.unwrap(name)];

        if (!Component) {
            console.error("Component is not defined:", ko.unwrap(name));

            return;
        }

        const Element = React.createElement(Component, params);

        ReactDOM.render(Element, element);
    }
};

ko.nodepath = function(path, options) {
    options = options || {};
    options.nodepath = true;

    let loading = stat.create();
    let result = ko.observable();
    let active = 0;
    let lastPath = false;
    let hasLoaded = false;

    let load = async (path) => {
        let data = false;

        loading(true);
        let currentActive = ++active;

        try {
            data = (await api.vfs.resolve(path, options)) || false;

            if (data) {
                data.node = ko.observable(data.node);
            }
        } catch (e) {
            stat.printError(e);
        }

        if (currentActive !== active) {
            return;
        }

        hasLoaded = true;
        loading(false);
        result(data);
    };

    let computed = ko.pureComputed(() => {
        let newPath = ko.unwrap(path);

        if (newPath !== lastPath) {
            lastPath = newPath;
            load(newPath);
        }
    });

    let pure = ko.pureComputed(() => {
        computed();
        return result();
    });

    pure.reload = () => {
        load(lastPath);
    };

    pure.hasLoaded = () => hasLoaded;

    let subscription = api.vfs.on("new|removed|update", (event) => {
        if (event.path === lastPath) {
            pure.reload();
        }
    });

    pure.dispose = () => {
        stat.destroy(loading);
        api.vfs.off(subscription);
    };

    return pure;
};

ko.nodepathList = function(path, options) {
    options = options || {};

    let loading = stat.create();
    let result = ko.observableArray([]);
    let active = 0;
    let lastPath = false;
    let hasLoaded = false;

    let load = async (path) => {
        let data = [];

        loading(true);
        let currentActive = ++active;

        try {
            data = (await api.vfs.list(path, options)) || [];

            for (let item of data) {
                item.node = ko.observable(item.node);
            }
        } catch (e) {
            stat.printError(e);
        }

        if (currentActive !== active) {
            return;
        }

        hasLoaded = true;
        loading(false);
        result(data);
    };

    let computed = ko.pureComputed(() => {
        let newPath = ko.unwrap(path);

        if (newPath !== lastPath) {
            lastPath = newPath;
            load(newPath);
        }
    });

    let pure = ko.pureComputed(() => {
        computed();
        return result();
    });

    pure.reload = () => {
        load(lastPath);
    };

    pure.hasLoaded = () => hasLoaded;

    let subscription = api.vfs.on("update", (event) => {
        if (event.path === lastPath) {
            pure.reload();
        } else if (utils.dirname(event.path) === lastPath) {
            let nodepath = result().filter((nodepath) => nodepath.path === event.path)[0];

            if (nodepath) {
                api.vfs.resolve(event.path)
                .then(nodepath.node)
                .catch((error) => {
                    console.error(error);
                });
            }
        }
    });

    pure.dispose = () => {
        stat.destroy(loading);
        api.vfs.off(subscription);
    };

    return pure;
};

ko.asyncComputed = function(defaultValue, fn, onError, extend) {
    let self = {};
    let promise = fn.bind(self);
    let reloadFlag = ko.observable(false);
    let result = ko.observable(defaultValue);
    let active = 0;
    let computed = ko.pureComputed(() => {
        let currentActive = ++active;
        reloadFlag();

        promise((value) => {
            return result(value);
        })
        .then((data) => {
            if (currentActive !== active) {
                return;
            }

            delete self.triggeredByReload;

            if (typeof data !== "undefined") {
                result(data);
            }
        })
        .catch((error) => {
            if (currentActive !== active) {
                return;
            }

            delete self.triggeredByReload;

            if (onError) {
                let ret = onError(error, result);

                result(ret || defaultValue);
            } else {
                result(defaultValue);
            }
        });
    });

    if (extend) {
        computed.extend(extend);
    }

    let pure = ko.pureComputed(() => {
        computed();
        return result();
    });

    pure.reload = () => {
        self.triggeredByReload = true;
        reloadFlag(!reloadFlag());
    };

    return pure;
};
