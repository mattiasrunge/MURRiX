
import React from "react";
import { XTerm } from "xterm-for-react";
import { FitAddon } from "xterm-addon-fit";
import { backend } from "lib/backend";
import ui from "lib/ui";
import theme from "./theme.module.css";

const fitAddon = new FitAddon();

const OPTIONS = {
    allowTransparency: true,
    fontFamily: "\"DejaVu Sans Mono\",monospace",
    fontSize: 13,
    letterSpacing: 1,
    theme: {
        background: "transparent",
        foreground: "white"
    }
};

const ADDONS = [
    fitAddon
];

const Terminal = () => {
    const ref = React.useRef();
    const [ active, setActive ] = React.useState(false);

    const activate = React.useCallback(() => {
        setActive(true);
        ref.current.terminal.focus();

        // TODO: This is a bit hackish, when is the animation done? We need to trigger on that
        // TODO: We need to listen to resize events, when the user resizes the window
        setTimeout(() => fitAddon.fit(), 1000);
    }, [ ref ]);

    const deactivate = React.useCallback(() => {
        setActive(false);
        ref.current.terminal.blur();
    }, [ ref ]);

    const onMessage = React.useCallback((event, message) => {
        if (message.type === "term") {
            ref.current.terminal.write(message.data);
        }
    }, [ ref ]);

    const onData = React.useCallback((data) => {
        backend.send({
            type: "term",
            data
        });
    }, []);

    const onResize = React.useCallback((size) => {
        backend.send({
            type: "term",
            size
        });
    }, []);

    const onKey = React.useCallback(({ domEvent }) => {
        if (domEvent.key === "t" && domEvent.altKey && !domEvent.ctrlKey && !domEvent.shiftKey && !domEvent.metaKey) {
            deactivate();
        }
    }, [ deactivate ]);

    React.useEffect(() => {
        const subscription = backend.on("message", onMessage);

        return () => subscription.dispose();
    }, [ onMessage ]);

    React.useEffect(() => {
        const subscription = ui.shortcut("alt+t", activate);

        return () => subscription.dispose();
    }, [ onMessage, activate ]);

    React.useEffect(() => {
        if (ref.current) {
            backend.send({
                type: "term"
            });
        }
    }, [ ref ]);

    return (
        <XTerm
            className={`${theme.terminal} animate__animated ${active ? "animate__slideInDown" : "animate__slideOutUp"}`}
            ref={ref}
            options={OPTIONS}
            onData={onData}
            onResize={onResize}
            onKey={onKey}
            addons={ADDONS}
        />
    );
};

export default Terminal;
