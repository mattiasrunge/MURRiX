
import React from "react";
import uploader from "lib/uploader";

const useUploaderState = () => {
    const [ state, setState ] = React.useState(uploader.getState());

    React.useEffect(() => {
        const subscription = uploader.on("state", (e, user) => setState(user));

        return () => subscription.dispose();
    }, []);

    return state;
};

export default useUploaderState;
