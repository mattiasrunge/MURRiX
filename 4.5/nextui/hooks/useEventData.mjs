
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const useEventData = () => {
    const fetch = React.useCallback(() => api.eventdata(), []);

    const { loading, value, error } = useAsync(fetch, null);

    return [
        value,
        error,
        loading
    ];
};

export default useEventData;
