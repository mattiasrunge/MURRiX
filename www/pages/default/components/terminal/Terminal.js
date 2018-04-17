
import Shell from "wsh.js";
import api from "api.io-client";
import session from "lib/session";
import ui from "lib/ui";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import commands from "./commands";

class Terminal extends Component {
    constructor(props) {
        super(props);

        this.shell = new Shell({
            getNode: async (path) => this.getNode(path),
            getChildNodes: async (path) => this.getChildNodes(path),
            shellViewId: props.shellViewId,
            shellPanelId: props.shellPanelId
        });

        this.shell.templates.prompt = (args) => this.renderPrompt(args);
        this.shell.getAbspath = async (path, useCwd) => {
            const cwd = this.shell.current().path;

            if (useCwd && !path) {
                return cwd;
            }

            return await api.vfs.normalize(cwd, path);
        };

        for (const name of Object.keys(commands)) {
            this.shell.setCommandHandler(name, commands[name]);
        }

        ui.shortcut("alt+t", this.toggle, (e, element, combo) => this.shell.isActive() && combo !== "alt+t");
    }

    renderPrompt(args) {
        return `<span class="${this.props.theme.promptUser}">${session.adminGranted() ? "+" : ""}${session.username()}</span> <span class="${this.props.theme.promptPath}">${args.node.path} $</span>`;
    }

    async getChildNodes(path) {
        const abspath = await api.vfs.normalize(this.shell.current().path, path);

        return await api.vfs.list(abspath, { noerror: true, nofollow: true });
    }

    async getNode(path) {
        if (!path) {
            return this.shell.current();
        }

        const abspath = await api.vfs.normalize(this.shell.current().path, path);

        return await api.vfs.resolve(abspath, { noerror: true });
    }

    activate() {
        this.shell.activate();
        this.ref.classList.add("slideInDown");
        this.ref.classList.remove("slideOutUp");
        this.ref.focus();
    }

    deactivate() {
        this.shell.deactivate();
        this.ref.classList.add("slideOutUp");
        this.ref.classList.remove("slideInDown");
        this.ref.blur();
    }

    toggle = () => {
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

        this.ref = ref;
        this.deactivate();
    }

    render() {
        return (
            <div
                id={this.props.shellPanelId}
                className={`${this.props.theme.terminal} animated`}
                ref={(ref) => this.onLoad(ref)}
            >
                <div id={this.props.shellViewId}></div>
            </div>
        );
    }
}

Terminal.defaultProps = {
    shellViewId: "shell-view",
    shellPanelId: "shell-panel"
};

Terminal.propTypes = {
    theme: PropTypes.object.isRequired,
    shellViewId: PropTypes.string,
    shellPanelId: PropTypes.string
};

export default Terminal;
