
import React from "react";
import { useRouter } from "next/router";
import { Home } from "components/home";
import { Year } from "components/search";

const HomeYearPage = () => {
    const router = useRouter();
    const year = React.useMemo(() => Number.parseInt(router.query?.year?.[0] ?? 0, 10), [ router ]);

    const setYear = React.useCallback((year) => {
        const path = router.pathname.replace("[[...year]]", year);
        router.push(path);
    }, [ router ]);

    React.useEffect(() => {
        if (!year) {
            setYear(new Date().getFullYear());
        }
    }, [ year, setYear ]);

    return (
        <Home>
            <If condition={year}>
                <Year
                    year={year}
                    setYear={setYear}
                />
            </If>
        </Home>
    );
};

export default HomeYearPage;
