
import React from "react";
import { useRouter } from "next/router";
import { Menu } from "semantic-ui-react";

const HomeButton = () => {
    const router = useRouter();
    const onHome = React.useCallback(() => {
        router.push("/");
    }, [ router ]);

    return (
        <Menu.Item
            icon="home"
            fitted="vertically"
            onClick={onHome}
        />
    );
};

export default HomeButton;
