
import React from "react";
import { api, event } from "lib/backend";
import utils from "lib/utils";
import useAsyncReducer from "./useAsyncReducer";

const reducer = (value, action) => {
    switch (action.type) {
    case "reset": {
        return [];
    }
    case "set": {
        return action.value;
    }
    case "replaceNode": {
        return [ ...value.filter(({ _id }) => _id !== action.node._id), action.node ];
    }
    case "addNode": {
        return [ ...value, action.node ];
    }
    case "removeNode": {
        return value.filter(({ _id }) => _id !== action.nodeId);
    }
    default: {
        throw new Error(`Unknown action type ${action.type} passed to reducer`);
    }
    }
};

const useNodeList = (pathParam, options) => {
    const paths = React.useMemo(() => Array.isArray(pathParam) ? pathParam : (pathParam ? [ pathParam ] : []), [ pathParam ]);

    const fetchNodes = React.useCallback(async () => {
        if (paths.length === 0) {
            return [];
        }

        return api.list(paths, {
            ...(options || {}),
            noerror: true
        });
    }, [ paths, options ]);

    const {
        loading,
        value,
        error,
        dispatch
    } = useAsyncReducer(fetchNodes, reducer, []);

    React.useEffect(() => {
        if (paths.length === 0) {
            return;
        }

        const onNodeUpdated = async (event, info) => {
            if (!paths.includes(utils.dirname(info.path))) {
                return;
            }

            dispatch({
                type: "replaceNode",
                node: await api.resolve(info.path)
            });
        };

        const onNodeAdded = async (event, info) => {
            if (!paths.includes(info.path)) {
                return;
            }

            dispatch({
                type: "addNode",
                node: await api.resolve(info.extra.childId)
            });
        };

        const onNodeRemoved = async (event, info) => {
            if (!paths.includes(info.path)) {
                return;
            }

            dispatch({
                type: "removeNode",
                nodeId: info.extra.childId
            });
        };

        const disposables = [
            event.on("node.update", onNodeUpdated),
            event.on("node.appendChild", onNodeAdded),
            event.on("node.removeChild", onNodeRemoved)
        ];

        return () => {
            for (const { dispose } of disposables) { dispose(); }
        };
    }, [ paths, dispatch ]);

    const nodes = React.useMemo(() => utils.sortNodeList([ ...value ]), [ value ]);

    return [
        nodes,
        error,
        loading
    ];
};

export default useNodeList;
