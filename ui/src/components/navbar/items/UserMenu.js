
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Dropdown } from "semantic-ui-react";
import { api } from "lib/backend";
import session from "lib/session";
import Component from "lib/component";
import { NodeImage } from "components/nodeparts";

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

    onSignOut = async () => {
        await api.logout();
    }

    onProfile = () => {
        this.props.history.push("/user");
    }

    onMe = () => {
        this.props.history.push(`/node${session.personPath()}`);
    }

    onStaging = () => {
        this.props.history.push("/user/upload");
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
                            path={`${this.state.user.personPath}/profilePicture`}
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
                        icon="upload"
                        text="Staging"
                        onClick={this.onStaging}
                    />
                    <Dropdown.Item
                        icon="user circle"
                        text="Profile"
                        onClick={this.onProfile}
                    />
                    <If condition={session.personPath()}>
                        <Dropdown.Item
                            icon="user"
                            text="Me"
                            onClick={this.onMe}
                        />
                        <Dropdown.Divider />
                    </If>
                    <Dropdown.Item
                        icon="sign out"
                        text="Sign out"
                        onClick={this.onSignOut}
                    />
                </Dropdown.Menu>
            </Dropdown>
        );
    }
}

UserMenu.propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(UserMenu);
