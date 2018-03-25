
import React from "react";
import PropTypes from "prop-types";
import session from "lib/session";
import Component from "lib/component";
import { Dropdown, Icon } from "semantic-ui-react";

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
                        icon="book"
                        text="Album"
                        onClick={() => this.onAdd("album")}
                    />
                    <Dropdown.Item
                        icon="user circle"
                        text="Person"
                        onClick={() => this.onAdd("person")}
                    />
                    <Dropdown.Item
                        icon="map"
                        text="Location"
                        onClick={() => this.onAdd("location")}
                    />
                    <Dropdown.Item
                        icon="camera retro"
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
