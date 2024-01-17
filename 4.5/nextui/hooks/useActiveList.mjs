
import React from "react";
import globalHook from "use-global-hook";

const initialState = {
    targetName: null
};

const actions = {
    setTargetName: (store, targetName) => {
        store.setState({ targetName });
    }
};

const useActiveList = globalHook(React, initialState, actions);

export default useActiveList;
