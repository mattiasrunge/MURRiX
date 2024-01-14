
import React from "react";
import { useRouter } from "next/router";
import { Home } from "components/home";
import { Label } from "components/search";

const HomeLabelPage = () => {
    const router = useRouter();
    const label = React.useMemo(() => router.query?.label?.[0] ?? "", [ router ]);

    const setLabel = React.useCallback((label) => {
        const path = router.pathname.replace("[[...label]]", label);
        router.push(path);
    }, [ router ]);

    return (
        <Home>
            <Label
                label={label}
                setLabel={setLabel}
            />
        </Home>
    );
};

export default HomeLabelPage;
