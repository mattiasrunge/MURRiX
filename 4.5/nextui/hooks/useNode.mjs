
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const useNode = (path) => {
    const fetch = React.useCallback(async () => path ? api.resolve(path) : null, [ path ]);

    const { loading, value, error } = useAsync(fetch, null);

    return [
        value,
        error,
        loading
    ];
};

export default useNode;
