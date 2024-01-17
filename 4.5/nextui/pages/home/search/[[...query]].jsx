
import React from "react";
import { useRouter } from "next/router";
import { Home } from "components/home";
import { Search } from "components/search";

const HomeSearchPage = () => {
    const router = useRouter();
    const query = React.useMemo(() => router.query?.query?.[0] ?? "", [ router ]);

    const setQuery = React.useCallback((query) => {
        const path = router.pathname.replace("[[...query]]", query);
        router.replace(path);
    }, [ router ]);

    return (
        <Home>
            <Search
                query={query}
                setQuery={setQuery}
            />
        </Home>
    );
};

export default HomeSearchPage;
