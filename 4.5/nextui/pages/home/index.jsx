
import React from "react";
import { useRouter } from "next/router";

const HomePage = () => {
    const router = useRouter();

    React.useEffect(() => {
        router.replace("/home/news");
    }, [ router ]);

    return null;
};

export default HomePage;
