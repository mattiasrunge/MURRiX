
import React from "react";
import { useRouter } from "next/router";
import { Home } from "components/home";
import { Name } from "components/search";

const HomeNamePage = () => {
    const router = useRouter();
    const letter = React.useMemo(() => router.query?.letter?.[0] ?? "", [ router ]);

    const setLetter = React.useCallback((letter) => {
        const path = router.pathname.replace("[[...letter]]", letter);
        router.push(path);
    }, [ router ]);

    return (
        <Home>
            <Name
                letter={letter}
                setLetter={setLetter}
            />
        </Home>
    );
};

export default HomeNamePage;
