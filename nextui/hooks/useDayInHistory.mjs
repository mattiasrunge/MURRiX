
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const useDayInHistory = (date) => {
    const fetch = React.useCallback(() => api.dayinhistory(date), [ date ]);

    const { loading, value, error } = useAsync(fetch, []);

    return [
        value,
        error,
        loading
    ];
};

export default useDayInHistory;
