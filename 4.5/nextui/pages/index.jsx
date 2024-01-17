
import React from "react";
import { useRouter } from "next/router";

const IndexPage = () => {
    const router = useRouter();

    React.useEffect(() => {
        router.replace("/home");
    }, [ router ]);

    return null;
};

export default IndexPage;
