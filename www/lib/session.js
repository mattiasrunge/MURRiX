"use strict";

const ko = require("knockout");
const api = require("api.io/api.io-client");

module.exports = {
    list: ko.observableArray(),
    user: ko.observable(false),
    username: ko.observable("guest"),
    personPath: ko.observable(false),
    stars: ko.observableArray(),
    loggedIn: ko.pureComputed(() => {
        return module.exports.user() && module.exports.username() !== "guest";
    }),
    searchPaths: ko.pureComputed(() => {
        if (module.exports.loggedIn()) {
            return [ "/people", "/locations", "/albums", "/cameras" ];
        }

        return [];
    }),
    loadUser: async () => {
        const userinfo = await api.auth.whoami();
        module.exports.user(userinfo.user);
        module.exports.username(userinfo.username);
        module.exports.personPath(userinfo.personPath);
        module.exports.stars(await api.auth.getStars());

        console.log(userinfo);
    },
    setStars: (stars) => {
        module.exports.stars(stars);
    }
};
