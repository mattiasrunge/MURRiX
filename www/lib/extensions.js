"use strict";

const co = require("co");
const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");
const node = require("lib/node");

ko.nodepath = function(path, options) {
    options = options || {};

    let loading = stat.create();
    let result = ko.observable(false);
    let active = 0;
    let lastPath = false;

    let load = co.wrap(function*(path) {
        let data = false;

        loading(true);
        let currentActive = ++active;

        try {
            data = (yield api.vfs.resolve(path, {
                nodepath: true,
                noerror: options.noerror
            })) || false;

            if (data) {
                data.node = ko.observable(data.node);
            }
        } catch (e) {
            stat.printError(e);
        }

        if (currentActive !== active) {
            return;
        }

        loading(false);
        result(data);
    });


    let computed = ko.pureComputed(() => {
        let newPath = ko.unwrap(path);

        if (newPath !== lastPath) {
            lastPath = newPath;
            load(newPath);
        }
    });

    let subscription = api.vfs.on("new|removed|update", (event) => {
        if (event.path === lastPath) {
            pure.reload();
        }
    });

    let pure = ko.pureComputed(() => {
        computed();
        return result();
    });

    pure.reload = () => {
        load(lastPath);
    };

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

    let load = co.wrap(function*(path) {
        let data = [];

        loading(true);
        let currentActive = ++active;

        try {
            data = (yield api.vfs.list(path, {
                noerror: options.noerror
            })) || [];

            for (let item of data) {
                item.node = ko.observable(item.node);
            }
        } catch (e) {
            stat.printError(e);
        }

        if (currentActive !== active) {
            return;
        }

        loading(false);
        result(data);
    });


    let computed = ko.pureComputed(() => {
        let newPath = ko.unwrap(path);

        if (newPath !== lastPath) {
            lastPath = newPath;
            load(newPath);
        }
    });

    let subscription = api.vfs.on("update", (event) => {
        if (event.path === lastPath || node.dirname(event.path) === lastPath) {
            pure.reload();
        }
    });

    let pure = ko.pureComputed(() => {
        computed();
        return result();
    });

    pure.reload = () => {
        load(lastPath);
    };

    pure.dispose = () => {
        stat.destroy(loading);
        api.vfs.off(subscription);
    };

    return pure;
};

ko.asyncComputed = function(defaultValue, fn, onError, extend) {
    let self = {};
    let promise = co.wrap(fn.bind(self));
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