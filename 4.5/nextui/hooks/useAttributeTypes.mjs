
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const useAttributeTypes = (type) => {
    const fetch = React.useCallback(() => api.attribtypes(type), [ type ]);

    const { loading, value, error } = useAsync(fetch, []);

    return [
        value,
        error,
        loading
    ];
};

export default useAttributeTypes;
