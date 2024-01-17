
import React from "react";

const useNodePath = (router) => React.useMemo(() => {
    if (router.asPath.startsWith("/node")) {
        return null;
    }

    const url = router.asPath.replace(/^\/node/, "");
    const [ path ] = url.split("/_/");

    if (path === "/") {
        return null;
    }

    return path;
}, [ router ]);

export default useNodePath;
