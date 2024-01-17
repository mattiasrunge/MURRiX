
import React from "react";
import { backend } from "lib/backend";
import session from "lib/session";

const useWebSocket = (coreURL) => {
    const [ ready, setReady ] = React.useState(false);

    const connect = React.useCallback(async () => {
        setReady(false);
        await backend.connect(coreURL);
        await session.init();
        setReady(true);
    }, [ coreURL ]);

    React.useEffect(() => {
        connect();
    }, [ connect ]);

    return ready;
};

export default useWebSocket;
