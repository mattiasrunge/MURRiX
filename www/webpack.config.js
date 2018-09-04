
const path = require("path");
const walk = require("walk-promise");
const fs = require("fs-extra-promise");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

// https://github.com/webpack/loader-utils/issues/56
process.traceDeprecation = true;

const settings = {
    CONTEXT: __dirname,
    CACHE_NAME: "babel_cache",
    BUNDLE_JS: "[name].js",
    BUNDLE_CSS: "[name].css",
    DIST: path.join(__dirname, "static"),
    MAIN: path.join(__dirname, "lib", "index.js"),
    INCLUDE: [
        __dirname,
        path.join(__dirname, "..", "node_modules"),
        path.join(__dirname, "..", "node_modules", "semantic-ui-css"),
        path.join(__dirname, "..", "node_modules", "animate.css")
    ],
    DYNAMIC: [
        path.join(__dirname, "types"),
        path.join(__dirname, "plugins")
    ],
    EXPLICIT_INCLUDES: [
        /node_modules\/api\.io/,
        /node_modules\/wsh\.js/,
        /node_modules\/ansi-regex/,
        /node_modules\/url-regex/
    ],
    PRESETS: [
        [
            "@babel/preset-env",
            {
                "useBuiltIns": "entry",
                "shippedProposals": true
            }
        ],
        "@babel/preset-react"
    ]
};

const getDynamicIncludes = async () => {
    const files = await walk(settings.DYNAMIC);

    return files
    .filter((f) => f && (f.name === "index.js" || f.name === "links.js"))
    .map((f) => path.join(f.root, f.name));
};

const getAlias = async () => {
    const alias = {};
    const files = await fs.readdirAsync(settings.CONTEXT);

    for (const file of files) {
        if (await fs.isDirectoryAsync(path.join(settings.CONTEXT, file))) {
            alias[`ui-${file}`] = path.join(settings.CONTEXT, file);
        }
    }

    return alias;
};

module.exports = async function(options) {
    const isProduction = !(options && options.dev);
    const dynamicFiles = []; //await getDynamicIncludes();

    return {
        context: settings.CONTEXT,
        mode: isProduction ? "production" : "development",
        externals: {
            configuration: options ? JSON.stringify(options.configuration) : {}
        },
        entry: {
            bundle: [
                "@babel/polyfill",
                ...dynamicFiles,
                settings.MAIN
            ]
        },
        output: {
            path: settings.DIST,
            filename: settings.BUNDLE_JS
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    loader: "babel-loader",
                    include: [
                        settings.CONTEXT,
                        ...settings.EXPLICIT_INCLUDES,
                        ...dynamicFiles
                    ],
                    exclude: (absPath) => {
                        const isNodeModule = /node_modules/.test(absPath);

                        return isNodeModule && !settings.EXPLICIT_INCLUDES.some((re) => re.test(absPath));
                    },
                    options: {
                        cacheDirectory: settings.CACHE_NAME,
                        presets: settings.PRESETS,
                        plugins: [
                            require.resolve("jsx-control-statements"),
                            [
                                "@babel/plugin-transform-async-to-generator",
                                {
                                    "module": "bluebird",
                                    "method": "coroutine"
                                }
                            ],
                            "@babel/plugin-proposal-class-properties",
                            "@babel/plugin-transform-modules-commonjs",
                            "@babel/plugin-proposal-object-rest-spread"
                        ]
                    }
                },
                {
                    test: /\.css$/,
                    exclude: [ /semantic-ui-css|animate.css/ ],
                    use: ExtractTextPlugin.extract({
                        fallback: "style-loader",
                        use: [
                            {
                                loader: "css-loader",
                                options: {
                                    modules: true,
                                    sourceMap: true,
                                    importLoaders: 1,
                                    getLocalIdent: (context, localIdentName, localName) => {
                                        const filepath = path
                                        .relative(settings.CONTEXT, context.resourcePath)
                                        .replace(/\.\.\//g, "")
                                        .replace(/\:|\.|\//g, "_");

                                        return `${filepath}__${localName.replace(/\./g, "_")}`;
                                    }
                                }
                            },
                            {
                                loader: "postcss-loader",
                                options: {
                                    plugins: [
                                        require("postcss-import")({
                                            root: settings.CONTEXT,
                                            path: settings.INCLUDE
                                        }),
                                        require("postcss-mixins")(),
                                        require("postcss-each")(),
                                        require("postcss-cssnext")()
                                    ]
                                }
                            }
                        ]
                    })
                },
                {
                    test: /\.css$/,
                    include: [ /semantic-ui-css|animate.css/ ],
                    use: ExtractTextPlugin.extract({
                        fallback: "style-loader",
                        use: [
                            {
                                loader: "css-loader",
                                options: {
                                    modules: false,
                                    sourceMap: true,
                                    importLoaders: 1
                                }
                            }
                        ]
                    })
                },
                {
                    test: /\.svg$/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                presets: settings.PRESETS
                            }
                        },
                        {
                            loader: "react-svg-loader",
                            options: {
                                jsx: true
                            }
                        }
                    ]
                },
                {
                    test: /\.woff(2)?|\.ttf?|\.eot?|\.png?|\.jpg?$/,
                    loader: "file-loader"
                }
            ]
        },
        plugins: [
            new webpack.NamedModulesPlugin(),
            new ExtractTextPlugin(settings.BUNDLE_CSS),
            new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /se/),
            new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false
            }),
            new webpack.DefinePlugin({
                "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development")
            }),
            new CompressionPlugin()
        ],
        resolve: {
            modules: settings.INCLUDE,
            alias: {
                ...(await getAlias()),
                "api.io-client": path.join(__dirname, "..", "node_modules", "api.io", "api.io-client"),
                "lib": path.join(__dirname, "lib"),
                "components": path.join(__dirname, "pages", "default", "components")
            }
        },
        node: {
            fs: "empty",
            net: "empty",
            tls: "empty",
            module: "empty",
            __filename: true
        },
        devtool: "cheap-module-source-map"
    };
};
