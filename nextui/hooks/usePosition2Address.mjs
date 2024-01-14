
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const usePosition2Address = (longitude, latitude) => {
    const fetch = React.useCallback(() => api.position2address(longitude, latitude), [ longitude, latitude ]);

    const { loading, value, error } = useAsync(fetch, []);

    return [
        value,
        error,
        loading
    ];
};

export default usePosition2Address;
