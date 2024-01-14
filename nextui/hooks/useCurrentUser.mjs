
import React from "react";
import session from "lib/session";

const useCurrentUser = () => {
    const [ user, setUser ] = React.useState(session.user());

    React.useEffect(() => {
        const subscription = session.on("update", (e, user) => setUser(user));

        return () => subscription.dispose();
    }, []);

    return user;
};

export default useCurrentUser;
