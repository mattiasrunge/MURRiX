"use strict";

const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

process.traceDeprecation = true;

module.exports = function(options) {
    const isProduction = !(options && options.dev);
    // List of regexes matching modules that shall be transpiled
    const explicitModuleIncludes = [
        /node_modules\/api\.io/,
        /node_modules\/react-photo-grid/
    ];
    const extractStyles = new ExtractTextPlugin("[name].css");

    const cfg = {
        externals: {
            configuration: options ? JSON.stringify(options.configuration) : {}
        },
        entry: {
            bundle: [
                "babel-polyfill",
                path.join(__dirname, "www", "lib", "index.js")
            ]
        },
        output: {
            path: path.join(__dirname, "www"),
            filename: "[name].js"
        },
        module: {
            rules: [
                {
                    test: /\.gif$/,
                    loader: "url-loader"
                },
                {
                    test: /\.jsx?$/,
                    loader: "babel-loader",
                    /* Include everything under this directory and all paths
                     * matching /managers/<ANYTHING>/client */
                    include: [
                        __dirname,
                        ...explicitModuleIncludes
                    ],
                    exclude: (absPath) => {
                        const isNodeModule = /node_modules/.test(absPath);
                        const isExplicitInclude = explicitModuleIncludes
                            .map((re) => re.test(absPath))
                            .filter((m) => m)
                            .length > 0;

                        return isNodeModule && !isExplicitInclude;
                    },
                    options: {
                        cacheDirectory: "babel_cache",
                        presets: [
                            require.resolve("babel-preset-es2015"),
                            require.resolve("babel-preset-stage-1"),
                            require.resolve("babel-preset-react")
                        ],
                        plugins: [
                            require.resolve("jsx-control-statements"),
                            [ require.resolve("babel-plugin-transform-async-to-module-method"), {
                                "module": "bluebird",
                                "method": "coroutine"
                            } ]
                        ]
                    }
                },
                {
                    test: /\.css$/,
                    use: extractStyles.extract({
                        fallback: "style-loader",
                        use: [
                            {
                                loader: "css-loader",
                                options: {
                                    modules: false,
                                    includePaths: [ path.join(__dirname, "..", "node_modules") ]
                                }
                            }
                        ]
                    })
                },
                {
                    test: /\.scss$/,
                    use: extractStyles.extract({
                        fallback: "style-loader",
                        use: [
                            {
                                loader: "css-loader",
                                options: {
                                    importLoaders: 2,
                                    modules: true,
                                    localIdentName: "[path]__[name]__[local]",
                                    includePaths: [
                                        path.join(__dirname, "..", "node_modules"),
                                        __dirname
                                    ]
                                }
                            }
                        ]
                    })
                },
                {
                    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: [
                        {
                            // TODO: Should probably use file-loader but then the files get the wrong mimetype
                            loader: "url-loader",
                            options: {
                                limit: 0,
                                mimetype: "application/font-woff"
                            }
                        }
                    ]
                },
                {
                    test: /\.ttf?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: [
                        {
                            // TODO: Should probably use file-loader but then the files get the wrong mimetype
                            loader: "url-loader",
                            options: {
                                limit: 0,
                                mimetype: "application/octet-stream"
                            }
                        }
                    ]
                },
                {
                    test: /\.eot?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: [
                        {
                            // TODO: Should probably use file-loader but then the files get the wrong mimetype
                            loader: "url-loader",
                            options: {
                                limit: 0,
                                mimetype: "application/vnd.ms-fontobject"
                            }
                        }
                    ]
                },
                {
                    test: /\.svg$/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                presets: [
                                    require.resolve("babel-preset-es2015"),
                                    require.resolve("babel-preset-react")
                                ]
                            }
                        },
                        {
                            loader: "react-svg-loader",
                            options: {
                                jsx: true
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            extractStyles,
            new webpack.ProvidePlugin({
                jQuery: "jquery",
                $: "jquery",
                jquery: "jquery",
                Tether: "tether"
            }),
            require("imports-loader")
        ],
        resolve: {
            modules: [
                "node_modules",
                path.join(__dirname, "node_modules")
            ],
            alias: {
                jquery: "jquery/src/jquery",
                "api.io-client": path.join(__dirname, "node_modules", "api.io", "api.io-client"),
                "lib": path.join(__dirname, "www", "lib"),
                "components": path.join(__dirname, "www", "pages", "default", "components"),
                "www": path.join(__dirname, "www"),
                "plugins": path.join(__dirname, "plugins")
            }
        },
        /* Declare node modules empty, not present in browser */
        node: {
            fs: "empty",
            net: "empty",
            tls: "empty",
            module: "empty"
        }
    };

    if (isProduction) {
        cfg.plugins.concat([
            new webpack.DefinePlugin({
                "process.env": {
                    "NODE_ENV": "production"
                }
            }),
            new webpack.optimize.DedupePlugin(),
            new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false
            }),
            new webpack.optimize.UglifyJsPlugin({
                compress: { warnings: false },
                mangle: true,
                sourceMap: true,
                beautify: false,
                dead_code: true // eslint-disable-line camelcase
            })
        ]);
    } else {
        const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");

        cfg.plugins.concat([
            new webpack.LoaderOptionsPlugin({
                debug: true
            })

        ]);

        cfg.plugins.unshift(new DuplicatePackageCheckerPlugin({
            verbose: true,
            emitError: false
        }));

        cfg.devtool = "cheap-module-source-map";
        cfg.output.publicPath = "/js";
        cfg.devServer = {
            host: "localhost",
            port: 8080 // Will be changed later when port is known
        };
    }

    return cfg;
};
