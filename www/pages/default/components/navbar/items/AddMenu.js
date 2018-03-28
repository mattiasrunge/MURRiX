
import React from "react";
import PropTypes from "prop-types";
import session from "lib/session";
import Component from "lib/component";
import { Dropdown, Icon } from "semantic-ui-react";
import { NodeIcon } from "components/node";

class AddMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user()
        };
    }

    async load() {
        this.addDisposable(session.on("update", (event, user) => this.setState({ user })));
    }

    onAdd(type) {

    }

    render() {
        if (!this.state.user || this.state.user.name === "guest") {
            return null;
        }

        return (
            <Dropdown
                item
                direction="left"
                simple
                trigger={(
                    <Icon
                        fitted
                        name="add"
                        style={{ margin: 0 }}
                    />
                )}
                icon={null}
            >
                <Dropdown.Menu fitted="vertically">
                    <Dropdown.Item
                        icon={(<NodeIcon type="a" />)}
                        text="Album"
                        onClick={() => this.onAdd("album")}
                    />
                    <Dropdown.Item
                        icon={(<NodeIcon type="p" />)}
                        text="Person"
                        onClick={() => this.onAdd("person")}
                    />
                    <Dropdown.Item
                        icon={(<NodeIcon type="l" />)}
                        text="Location"
                        onClick={() => this.onAdd("location")}
                    />
                    <Dropdown.Item
                        icon={(<NodeIcon type="c" />)}
                        text="Camera"
                        onClick={() => this.onAdd("camera")}
                    />
                </Dropdown.Menu>
            </Dropdown>
        );
    }
}

AddMenu.propTypes = {
    theme: PropTypes.object
};

AddMenu.contextTypes = {
    router: PropTypes.object.isRequired
};

export default AddMenu;
