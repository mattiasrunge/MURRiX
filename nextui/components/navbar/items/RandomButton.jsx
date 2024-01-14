
import React from "react";
import { useRouter } from "next/router";
import { NotificationManager } from "react-notifications";
import { Menu } from "semantic-ui-react";
import { api } from "lib/backend";
import useCurrentUser from "hooks/useCurrentUser";
import useNodePath from "hooks/useNodePath";

const RandomButton = () => {
    const router = useRouter();
    const nodePath = useNodePath(router);
    const user = useCurrentUser();
    const [ loading, setLoading ] = React.useState(false);

    const onRandom = React.useCallback(async () => {
        const includePaths = [ "/albums" ];
        const excludePaths = [];
        nodePath && excludePaths.push(nodePath);

        setLoading(true);

        try {
            const node = await api.random(includePaths, excludePaths);

            router.push(`/node${node.path}`);
        } catch (error) {
            console.error("Failed to get random", error);
            NotificationManager.error(`Failed to get random, ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [ router, nodePath ]);

    if (!user || user.isGuest) {
        return null;
    }

    return (
        <Menu.Item
            icon="random"
            fitted="vertically"
            onClick={onRandom}
            disabled={loading}
        />
    );
};

export default RandomButton;
