"use strict";

const path = require("path");
const transpileModules = require("next-transpile-modules");
// const { getOpts } = require("misc");

const withTM = transpileModules([
    "xterm-for-react",
    "react-leaflet",
    "leaflet"
]);

module.exports = withTM({
    serverRuntimeConfig: {},
    publicRuntimeConfig: {
        // ...getOpts("npm_package_config_"),
        // ...getOpts("config_"),
        coreURL: "ws://localhost:8080",
        ...global.publicRuntimeConfig,
        // version: process.env.service_version || false
    },
    future: {
        webpack5: true
    },
    webpack: (config, { defaultLoaders }) => {
        defaultLoaders.babel.options.plugins = defaultLoaders.babel.options.plugins || [];

        // We use use this plugin for JSX control flow
        defaultLoaders.babel.options.plugins.push("jsx-control-statements");

        // These are to support older browsers like pre chrome MS Edge
        // defaultLoaders.babel.options.plugins.push("@babel/plugin-proposal-class-properties");
        // defaultLoaders.babel.options.plugins.push("@babel/plugin-proposal-object-rest-spread");

        // Make sure all our files are resolved correctly
        // const babelRule = config.module.rules.find(({ test }) => test && test.test("t.js"));
        // const targetDir = babelRule.include.find((n) => n.endsWith(".combined"));
        // babelRule.include.push(/libs\/ui/);
        // babelRule.include.push(path.dirname(targetDir));

        // Since we symlink our entire tree, hide that fact
        // config.resolve.symlinks = false;

        // Create a special alias for ui, it will be linked into the
        // target tree since nextjs refuses to load module.css files
        // outside of it's own tree... :(
        // config.resolve.alias.ui = path.resolve(targetDir, "_ui_lib_");

        // Webpack 4 will give a "module is not defined" for .mjs files
        // without this. Webpack 5 seems to work but causes other issues
        // so we'll stick with 4 for now.
        config.module.rules.push({
            type: "javascript/auto",
            test: /\.mjs$/,
            use: []
        });

        return config;
    }
});
