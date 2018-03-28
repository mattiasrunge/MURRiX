
import React from "react";
import PropTypes from "prop-types";
import api from "api.io-client";
import session from "lib/session";
import Component from "lib/component";
import { Dropdown } from "semantic-ui-react";
import { NodeImage } from "components/node";

class UserMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user()
        };
    }

    async load() {
        this.addDisposable(session.on("update", (event, user) => this.setState({ user })));
    }

    async onSignOut() {
        await api.vfs.logout();
    }

    onProfile() {
        this.context.router.history.push("/home/profile");
    }

    onMe() {

    }

    render() {
        if (!this.state.user || this.state.user.name === "guest") {
            return null;
        }

        return (
            <Dropdown
                item
                fitted="vertically"
                direction="left"
                simple
                trigger={(
                    <span>
                        <NodeImage
                            path={`${this.state.user.path}/person/profilePicture`}
                            format={{
                                width: 28,
                                height: 28,
                                type: "image"
                            }}
                            avatar
                            spaced="right"
                            type="u"
                        />
                        {this.state.user.attributes.name}
                    </span>
                )}
            >
                <Dropdown.Menu>
                    <Dropdown.Item
                        icon="user"
                        text="Profile"
                        onClick={() => this.onProfile()}
                    />
                    <Dropdown.Item
                        icon="user circle"
                        text="Me"
                        onClick={() => this.onMe()}
                    />
                    <Dropdown.Divider />
                    <Dropdown.Item
                        icon="sign out"
                        text="Sign out"
                        onClick={() => this.onSignOut()}
                    />
                </Dropdown.Menu>
            </Dropdown>
        );
    }
}

UserMenu.propTypes = {
    theme: PropTypes.object,
    location: PropTypes.object.isRequired
};

UserMenu.contextTypes = {
    router: PropTypes.object.isRequired
};

export default UserMenu;
