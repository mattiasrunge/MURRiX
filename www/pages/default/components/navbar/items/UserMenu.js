
import React from "react";
import PropTypes from "prop-types";
import session from "lib/session";
import Component from "lib/component";
import { Menu, Dropdown, Icon } from "semantic-ui-react";

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

    onSignIn() {
        // this.context.router.history.push(`/node${selected.node.path}`);
    }

    onSignOut() {

    }

    onProfile() {

    }

    onMe() {

    }

    render() {
        return (
            <Choose>
                <When condition={!this.state.user || this.state.user.name === "guest"}>
                    <Menu.Item
                        name="Sign in"
                        fitted="vertically"
                        onClick={() => this.onSignIn()}
                    />
                </When>
                <Otherwise>
                    <Dropdown
                        item
                        fitted="vertically"
                        trigger={(
                            <span>
                                <Icon name="user" /> {this.state.user.attributes.name}
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
                </Otherwise>
            </Choose>
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
