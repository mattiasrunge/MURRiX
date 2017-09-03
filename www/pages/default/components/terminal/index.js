
/* global document */

import Terminal from "wsh.js";
import api from "api.io-client";
import $ from "jquery";
import session from "lib/session";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import commands from "./commands";

class DefaultTerminal extends Component {
    constructor(props) {
        super(props);

        this.terminal = new Terminal({
            getNode: async (path) => this.getNode(path),
            getChildNodes: async (path) => this.getChildNodes(path),
            shellViewId: props.shellViewId,
            shellPanelId: props.shellPanelId
        });

        this.terminal.templates.prompt = (args) => this.renderPrompt(args);
        this.terminal.getAbspath = async (path, useCwd) => {
            const cwd = this.terminal.current().path;

            if (useCwd && !path) {
                return cwd;
            }

            return await api.vfs.normalize(cwd, path);
        };

        for (const name of Object.keys(commands)) {
            this.terminal.setCommandHandler(name, commands[name]);
        }
    }

    renderPrompt(args) {
        return `<span class="promptUser">${session.adminGranted() ? "+" : ""}${session.username()}</span> <span class="promptPath">${args.node.path} $</span>`;
    }

    async getChildNodes(path) {
        const abspath = await api.vfs.normalize(this.terminal.current().path, path);

        return await api.vfs.list(abspath, { noerror: true, nofollow: true });
    }

    async getNode(path) {
        if (!path) {
            return this.terminal.current();
        }

        const abspath = await api.vfs.normalize(this.terminal.current().path, path);

        return await api.vfs.resolve(abspath, { nodepath: true, noerror: true });
    }

    componentDidMount() {
        this.addDisposables([
            session.loggedIn.subscribe((loggedIn) => {
                if (this.terminal.isActive() && !loggedIn) {
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
        super.componentWillUnmount();
    }

    activate() {
        if (!session.loggedIn()) {
            return;
        }

        this.terminal.activate();
        this.ref.addClass("slideInDown");
        this.ref.removeClass("slideOutUp");
        this.ref.show();
        this.ref.focus();
    }

    deactivate() {
        this.terminal.deactivate();
        this.ref.addClass("slideOutUp");
        this.ref.removeClass("slideInDown");
        this.ref.blur();
    }

    toggle() {
        if (this.terminal.isActive()) {
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
                id={this.props.shellPanelId}
                className="terminal animated"
                ref={(ref) => this.onLoad(ref)}
            >
                <div id={this.props.shellViewId}></div>
            </div>
        );
    }
}

DefaultTerminal.defaultProps = {
    shellViewId: "shell-view",
    shellPanelId: "shell-panel"
};

DefaultTerminal.propTypes = {
    shellViewId: PropTypes.string,
    shellPanelId: PropTypes.string
};

export default DefaultTerminal;
