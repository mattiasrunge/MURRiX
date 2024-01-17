
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";
import useCurrentUser from "hooks/useCurrentUser";

const useStars = () => {
    const user = useCurrentUser();
    const fetch = React.useCallback(async () => user && user.name !== "guest" ? api.stars() : null, [ user ]);

    const { loading, value, error } = useAsync(fetch, []);

    return [
        value,
        error,
        loading
    ];
};

export default useStars;
