
import React from "react";
import { api, event } from "lib/backend";
import utils from "lib/utils";
import useAsyncReducer from "./useAsyncReducer";

const reducer = (value, action) => {
    switch (action.type) {
        case "reset": {
            return [];
        }
        case "set":  {
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

const useNodeList = (path) => {
    const [ nodes, setNodes ] = React.useState([]);
    const fetchNodes = React.useCallback(async () => {
        console.log("fetchNodes", path)
        if (!path) {
            return [];
        }

        return api.list(path, {
            noerror: true
        });
    }, [ path ]);

    const {
        loading,
        value,
        error,
        dispatch
    } = useAsyncReducer(fetchNodes, reducer, []);

    React.useEffect(() => {
        if (!path) {
            return;
        }

        const onNodeUpdated = async (event, info) => {
            if (utils.dirname(info.path) === path) {
                dispatch({
                    type: "replaceNode",
                    node: await api.resolve(info.path)
                });
            }
        };

        const onNodeAdded = async (event, info) => {
            if (info.path !== path) {
                return;
            }

            dispatch({
                type: "addNode",
                node: await api.resolve(info.extra.childId)
            });
        };

        const onNodeRemoved = async (event, info) => {
            if (info.path !== path) {
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
            disposables.forEach(({ dispose }) => dispose());
        };
    }, [ path ]);

    React.useEffect(() => {
        setNodes(utils.sortNodeList(value.slice(0)));
    }, [ value ]);

    return {
        loading,
        error,
        nodes
    };
};

export default useNodeList;
