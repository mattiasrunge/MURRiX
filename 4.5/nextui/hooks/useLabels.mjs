
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const useLabels = (path) => {
    const fetch = React.useCallback(() => api.labels(path), [ path ]);

    const { loading, value, error } = useAsync(fetch, []);

    const labels = React.useMemo(() => [ ...value ].sort((a, b) => b.count - a.count), [ value ]);

    return [
        labels,
        error,
        loading
    ];
};

export default useLabels;
