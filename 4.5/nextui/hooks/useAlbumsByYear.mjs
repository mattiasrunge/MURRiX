
import React from "react";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";

const useAlbumsByYear = (year) => {
    const fetch = React.useCallback(() => year ? api.albumsbyyear(year) : [], [ year ]);

    const { loading, value, error } = useAsync(fetch, []);

    return [
        value,
        error,
        loading
    ];
};

export default useAlbumsByYear;
