
/* global document */

import Josh from "josh.js";
import api from "api.io-client";
import $ from "jquery";
import columnify from "columnify";
import moment from "moment";
import utils from "lib/utils";
import session from "lib/session";
import React from "react";
import Component from "lib/component";
import commands from "./commands";

class DefaultTerminal extends Component {
    constructor(props) {
        super(props);

        this.shell = Josh.Shell(); // eslint-disable-line
        this.pathhandler = new Josh.PathHandler(this.shell);

        this.pathhandler.current = {
            name: "",
            path: "/"
        };

        this.pathhandler.getNode = (path, callback) => {
            this.getNode(path).then(callback);
        };

        this.pathhandler.getChildNodes = (node, callback) => {
            this.getChildNodes(node.path, false).then(callback);
        };

        this.pathhandler.getChildNodesEx = (node, callback) => {
            this.getChildNodes(node.path, true).then(callback);
        };

        this.shell.templates.prompt = (args) => this.renderPrompt(args);

        this.shell.templates.ls_ex = (args) => this.renderList(args); // eslint-disable-line

        for (const name of Object.keys(commands)) {
            const options = {};

            options.exec = (cmd, args, callback) => {
                this.executeCommand(commands[name], cmd, args)
                    .then(callback)
                    .catch((error) => callback(this.renderError(error)));
            };

            if (commands[name].completion) {
                // TODO
                // options.completion = (cmd, args, line, callback) => {
                //     this.completeCommand(commands[name], cmd, args, line)
                //         .then(callback)
                //         .catch((error) => callback(this.renderError(error)));
                // };
            } else if (commands[name].completion !== false) {
                options.completion = this.pathhandler.pathCompletionHandler;
            }

            this.shell.setCommandHandler(name, options);
        }
    }

    renderHelp(command, cmd, error = false) {
        const args = command.args.map((a) => a[0] === "?" ? `[${a.substr(1)}]` : `&lt;${a}&gt;`);
        const opts = Object.keys(command.opts).map((o) => `  -${o}  ${command.opts[o]}`);
        const err = error && error.message ? `<span class="error">${error}</span>\n` : "";

        return `${err}
Usage: ${cmd} ${opts.length > 0 ? "[options] " : ""}${args.join(" ")}

${command.desc}

Options:

  -h  Print help
${opts.join("\n")}
        `;
    }

    async executeCommand(command, cmd, rawArgs) {
        try {
            const { opts, args } = this.parseArgs(command, rawArgs);

            return command.exec(this, cmd, opts, args);
        } catch (error) {
            return this.renderHelp(command, cmd, error);
        }
    }

    parseArgs(command, rawArgs) {
        const argsList = rawArgs.filter((a) => a[0] !== "-");
        const optsList = rawArgs.filter((a) => a[0] === "-").map((a) => a.substr(1));

        if (optsList.includes("h")) {
            throw new Error();
        }

        const opts = {};
        const args = {};

        for (const name of optsList) {
            if (!command.opts[name]) {
                throw new Error(`Unknown option -${name}`);
            }
        }

        for (const name of Object.keys(command.opts)) {
            opts[name] = optsList.includes(name);
        }

        for (let n = 0; n < command.args.length; n++) {
            const rawName = command.args[n];
            const optional = rawName[0] === "?";
            const name = optional ? rawName.substr(1) : rawName;

            if (optional) {
                if (argsList[n]) {
                    args[name] = argsList[n];
                } else {
                    break;
                }
            } else if (argsList[n]) {
                args[name] = argsList[n];
            } else {
                throw new Error(`Missing parameter ${name}`);
            }
        }

        return { opts, args };
    }

    renderError(error) {
        return `<span class="error">${error.stack}</span>`;
    }

    renderPrompt(args) {
        return `<span class="promptUser">${session.username()}</span> <span class="promptPath">${args.node.path} $</span>`;
    }

    renderList(args) {
        const columns = columnify(args.nodes.map((item) => {
            let name = item.name;

            if (item.node.properties.type === "s") {
                name += ` -> ${item.node.attributes.path}`;
            }

            const acl = item.node.properties.acl && item.node.properties.acl.length > 0 ? "+" : "";
            const mode = utils.modeString(item.node.properties.mode);

            return {
                mode: item.node.properties.type + mode + acl,
                count: item.node.properties.count,
                uid: item.uid,
                gid: item.gid,
                children: Object.keys(item.node.properties.children).length,
                mtime: moment(item.node.properties.mtime).format(),
                name: name
            };
        }), {
            showHeaders: false
        });

        return columns.split("\n").map((line) => `<div>${line}</div>`);
    }

    async getChildNodes(path, all) {
        const abspath = await api.vfs.normalize(this.pathhandler.current.path, path);
        const list = await api.vfs.list(abspath, { noerror: true, all });

        if (all) {
            const ucache = {};
            const gcache = {};

            for (const item of list) {
                const uid = item.node.properties.uid;
                const gid = item.node.properties.gid;

                item.uid = ucache[uid] = ucache[uid] || await api.auth.uname(uid);
                item.gid = gcache[gid] = gcache[gid] || await api.auth.gname(gid);
            }
        }

        return list;
    }

    async getNode(path) {
        if (!path) {
            return this.pathhandler.current;
        }

        const abspath = await api.vfs.normalize(this.pathhandler.current.path, path);

        return await api.vfs.resolve(abspath, { nodepath: true, noerror: true });
    }

    componentDidMount() {
        this.addDisposables([
            session.loggedIn.subscribe((loggedIn) => {
                if (this.shell.isActive() && !loggedIn) {
                    this.deactivate();
                }
            })
        ]);

        $(document).keydown((event) => {
            if (event.altKey && event.which === 84) {
                this.toggle();
            }
        });
    }

    componentWillUnmount() {
        $(document).off("keydown");
    }

    activate() {
        if (!session.loggedIn()) {
            return;
        }

        this.shell.activate();
        this.ref.addClass("slideInDown");
        this.ref.removeClass("slideOutUp");
        this.ref.show();
        this.ref.focus();
    }

    deactivate() {
        this.shell.deactivate();
        this.ref.addClass("slideOutUp");
        this.ref.removeClass("slideInDown");
        this.ref.blur();
    }

    toggle() {
        if (this.shell.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    onLoad(ref) {
        if (!ref) {
            return;
        }

        this.ref = $(ref);
    }

    render() {
        return (
            <div
                id="shell-panel"
                className="terminal animated"
                ref={(ref) => this.onLoad(ref)}
            >
                <div id="shell-view"></div>
            </div>
        );
    }
}

export default DefaultTerminal;
