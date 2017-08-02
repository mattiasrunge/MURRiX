
/* global document */

import Josh from "josh.js";
import api from "api.io-client";
import $ from "jquery";
import session from "lib/session";
import React from "react";
import Component from "lib/component";

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

        this.shell.templates.prompt = (args) => `<span class="promptUser">${session.username()}</span>  <span class="promptPath">${args.node.path}  $</span>`;
    }

    async getChildNodes(path, all) {
        const abspath = await api.vfs.normalize(this.pathhandler.current.path, path);

        return await api.vfs.list(abspath, { noerror: true, all });
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
        this.ref.slideDown();
        this.ref.focus();
    }

    deactivate() {
        this.shell.deactivate();
        this.ref.slideUp();
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
                className="terminal"
                ref={(ref) => this.onLoad(ref)}
            >
                <div id="shell-view"></div>
            </div>
        );
    }
}

export default DefaultTerminal;
