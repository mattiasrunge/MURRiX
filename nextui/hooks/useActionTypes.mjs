
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const useActionTypes = (type) => {
    const fetch = React.useCallback(() => api.actiontypes(type), [ type ]);

    const { loading, value, error } = useAsync(fetch, []);

    return [
        value,
        error,
        loading
    ];
};

export default useActionTypes;
