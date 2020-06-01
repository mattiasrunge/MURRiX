
import React from "react";
import { XTerm } from "xterm-for-react";
import { FitAddon } from "xterm-addon-fit";
import { backend } from "lib/backend";
import ui from "lib/ui";
import Component from "lib/component";
import theme from "./theme.module.css";

class Terminal extends Component {
    constructor(props) {
        super(props);

        this.fitAddon = new FitAddon();

        backend.on("message", this.onMessage);

        ui.shortcut("alt+t", this.activate);

        this.state = {
            active: false
        };
    }

    onMessage = (event, message) => {
        if (message.type !== "term") {
            return;
        }

        this.ref.terminal.write(message.data);
    }

    activate = () => {
        this.setState({ active: true });
        this.ref.terminal.focus();

        // TODO: This is a bit hackish, when is the animation done? We need to trigger on that
        // TODO: We need to listen to resize events, when the user resizes the window
        setTimeout(() => this.fitAddon.fit(), 1000);
    }

    deactivate = () => {
        this.setState({ active: false });
        this.ref.terminal.blur();
    }

    onWindowRef = (ref) => {
        this.ref = ref;

        backend.send({
            type: "term"
        });
    }

    onData = (data) => {
        backend.send({
            type: "term",
            data
        });
    }

    onResize = (size) => {
        backend.send({
            type: "term",
            size
        });
    }

    onKey = ({ domEvent }) => {
        if (domEvent.key === "t" && domEvent.altKey && !domEvent.ctrlKey && !domEvent.shiftKey && !domEvent.metaKey) {
            this.deactivate();
        }
    }

    render() {
        return (
            <XTerm
                className={`${theme.terminal} animate__animated ${this.state.active ? "animate__slideInDown" : "animate__slideOutUp"}`}
                ref={this.onWindowRef}
                options={{
                    allowTransparency: true,
                    fontFamily: "\"DejaVu Sans Mono\",monospace",
                    fontSize: 13,
                    letterSpacing: 1,
                    theme: {
                        background: "transparent",
                        foreground: "white"
                    }
                }}
                onData={this.onData}
                onResize={this.onResize}
                onKey={this.onKey}
                addons={[
                    this.fitAddon
                ]}
            />
        );
    }
}

export default Terminal;
