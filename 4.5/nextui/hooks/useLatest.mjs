
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const useLatest = (count = 20) => {
    const fetch = React.useCallback(() => api.latest(count), [ count ]);

    const { loading, value, error } = useAsync(fetch, []);

    return [
        value,
        error,
        loading
    ];
};

export default useLatest;
