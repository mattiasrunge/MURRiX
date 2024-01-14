
import React from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import { Dropdown } from "semantic-ui-react";
import { api } from "lib/backend";
import { NodeImage } from "components/nodeparts";

const PICTURE_FORMAT = {
    width: 28,
    height: 28,
    type: "image"
};

const UserMenu = ({ user }) => {
    const router = useRouter();
    const onSignOut = React.useCallback(() => api.logout(), []);

    const onProfile = React.useCallback(() => {
        router.push("/user");
    }, [ router ]);

    const onMe = React.useCallback(() => {
        router.push(`/node${user.personPath}`);
    }, [ router, user ]);

    const onStaging = React.useCallback(() => {
        router.push("/user/upload");
    }, [ router ]);

    return (
        <Dropdown
            item
            fitted="vertically"
            direction="left"
            simple
            trigger={(
                <span>
                    <NodeImage
                        path={`${user.personPath}/profilePicture`}
                        format={PICTURE_FORMAT}
                        avatar
                        spaced="right"
                        type="u"
                    />
                    {user.attributes.name}
                </span>
            )}
        >
            <Dropdown.Menu>
                <Dropdown.Item
                    icon="upload"
                    text="Staging"
                    onClick={onStaging}
                />
                <Dropdown.Item
                    icon="user circle"
                    text="Profile"
                    onClick={onProfile}
                />
                <If condition={user.personPath}>
                    <Dropdown.Item
                        icon="user"
                        text="Me"
                        onClick={onMe}
                    />
                    <Dropdown.Divider />
                </If>
                <Dropdown.Item
                    icon="sign out"
                    text="Sign out"
                    onClick={onSignOut}
                />
            </Dropdown.Menu>
        </Dropdown>
    );
};

UserMenu.propTypes = {
    user: PropTypes.object.isRequired
};

export default UserMenu;
