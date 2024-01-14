
import React from "react";
import PropTypes from "prop-types";
import { Container } from "semantic-ui-react";
import ui from "lib/ui";
import useCurrentUser from "hooks/useCurrentUser";
import { Sections } from "components/sections";
import { Edit } from "components/edit";
import Organize from "components/node/pages/sections/Organize";
import { Upload } from "components/upload";
import { Tagging } from "components/tagging";
import { Actions } from "components/actions";
import { Dropbox } from "components/dropbox";
import { PageHeader } from "components/header";

const User = ({ sectionName, setSectionName }) => {
    const user = useCurrentUser();
    const sections = React.useMemo(() => ([
        {
            name: "profile",
            title: "Profile"
        },
        {
            name: "edit",
            title: "Edit",
            icon: "edit",
            active: sectionName === "edit",
            Component: Edit,
            props: {
                node: user
            }
        },
        {
            name: "actions",
            title: "Actions",
            icon: "keyboard",
            active: sectionName === "actions",
            Component: Actions,
            props: {
                node: user
            }
        },
        {
            name: "staging",
            title: "Staging"
        },
        {
            name: "dropbox",
            title: "Dropbox",
            icon: "dropbox",
            active: sectionName === "dropbox",
            Component: Dropbox
        },
        {
            name: "upload",
            title: "Upload",
            icon: "upload",
            active: sectionName === "upload",
            Component: Upload,
            props: {
                node: user
            }
        },
        {
            name: "organize",
            title: "Organize",
            icon: "folder open outline",
            active: sectionName === "organize",
            Component: Organize,
            props: {
                node: user
            }
        },
        {
            name: "tagging",
            title: "Tagging",
            icon: "user",
            active: sectionName === "tagging",
            Component: Tagging,
            props: {
                node: user
            }
        }
    ]), [ sectionName, user ]);

    const section = React.useMemo(() => sections.find(({ name }) => name === sectionName), [ sections, sectionName ]);

    React.useEffect(() => {
        if (!sectionName) {
            setSectionName(sections[1].name);
        }
    }, [ sectionName, setSectionName, sections ]);

    ui.setTitle("Profile");

    return (
        <Container>
            <PageHeader
                profilePath={`${user.personPath}/profilePicture`}
                title={user.attributes.name}
                subtitle="User profile and staging area"
            />

            <Sections
                sections={sections}
                section={section}
                setSection={setSectionName}
            />
        </Container>
    );
};

User.propTypes = {
    sectionName: PropTypes.string,
    setSectionName: PropTypes.func.isRequired
};

export default User;
