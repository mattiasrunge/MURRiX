
import React from "react";
import { useRouter } from "next/router";
import { User } from "components/user";

const UserPage = () => {
    const router = useRouter();
    const section = React.useMemo(() => router.query?.section?.[0], [ router ]);

    const setSection = React.useCallback((section) => {
        const path = router.pathname.replace("[[...section]]", section);
        router.push(path);
    }, [ router ]);

    return (
        <User
            sectionName={section}
            setSectionName={setSection}
        />
    );
};

export default UserPage;
