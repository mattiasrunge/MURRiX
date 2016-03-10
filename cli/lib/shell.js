"use strict";

const co = require("bluebird").coroutine;
const promisify = require("bluebird").promisify;
const path = require("path");
const Corporal = require("corporal");
const glob = promisify(require("glob"));
const split = require("split");

require("colors");

let corporal = null;

module.exports = {
    init: co(function*() {
        let files = yield glob(__dirname + "/commands/*.js", { nodir: true });
        let commands = {};

        for (let file of files) {
            let name = path.basename(file, ".js");

            commands[name] = require(file);

            if (commands[name].load) {
                commands[name].init = (session, callback) => {
                    co(commands[name].load)(session)
                    .catch((error) => {
                        session.stdout().write(error.toString().red + "\n");
                    })
                    .finally(() => {
                        callback();
                    });
                };
            }

            if (commands[name].completer) {
                commands[name].autocomplete = (session, args, callback) => {
                    co(commands[name].completer)(session, args)
                    .then((result) => {
                        callback(null, result);
                    })
                    .catch((error) => {
                        session.stdout().write(error.toString().red + "\n");
                        callback();
                    });
                };
            }

            commands[name].invoke = (session, args, callback) => {
                session.ask = (question) => {
                    return new Promise((resolve) => {
                        let dest = split();
                        let pipe = session.stdin().pipe(dest);

                        session.stdout().write(question + " ");
                        pipe.on("data", (line) => {
                            session.stdin().unpipe(dest);
                            resolve(line);
                        });
                    });
                };

                session.confirm = (question) => {
                    return new Promise((resolve) => {
                        let dest = split();
                        let pipe = session.stdin().pipe(dest);

                        session.stdout().write(question + " [y/n] ");
                        pipe.on("data", (line) => {
                            session.stdin().unpipe(dest);
                            resolve(/^y|yes|ok|true$/i.test(line));
                        });
                    });
                };

                session.password = (question) => {
                    return new Promise((resolve) => {
                        let dest = split();
                        let pipe = session.stdin().pipe(dest);

                        session.stdout().write((question || "Password") + ": ");
                        pipe.on("data", (line) => {
                            session.stdin().unpipe(dest);
                            resolve(line);
                        });
                    });
                };

                let params = commands[name].help.split(" ").slice(2).map((param) => param.slice(0, param.length - 1));
                let argsHash = {};

                for (let n = 0; n < params.length; n++) {
                    let required = params[n][0] === "<";
                    let param = params[n].slice(1);

                    if (required && typeof args[n] === "undefined") {
                        session.stdout().write(("Missing " + param.bold + " from command, type 'help' for usage").red + "\n");
                        return callback();
                    }

                    argsHash[param] = args[n];
                }

                co(commands[name].execute)(session, argsHash)
                .catch((error) => {
                    session.stdout().write(error.toString().red + "\n");
                })
                .finally(() => {
                    callback();
                });
            };
        }

        corporal = new Corporal({
            commands: commands,
            env: {
                username: "guest",
                cwd: "/",
                ps1: "%(username)s".cyan + " %(cwd)s ] ".bold,
                ps2: "> "
            }
        });

        yield new Promise((resolve) => {
            corporal.on("load", () => {
                corporal.loop({ history: [ "cd test", "import /test" ] });
                resolve();
            });
        });
    })
};
