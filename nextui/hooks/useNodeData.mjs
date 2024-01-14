
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const useNodeData = (opts) => {
    const fetch = React.useCallback(() => api.nodedata(opts), [ opts ]);

    const { loading, value, error } = useAsync(fetch, null);

    return [
        value,
        error,
        loading
    ];
};

export default useNodeData;
