
import React, { Fragment } from "react";
import PropTypes from "prop-types";
import session from "lib/session";
import Component from "lib/component";
import { Dropdown, Icon } from "semantic-ui-react";
import { NodeIcon } from "components/nodeparts";
import { CreateModal } from "components/edit";

class AddMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            create: null
        };
    }

    async load() {
        this.addDisposable(session.on("update", (event, user) => this.setState({ user })));
    }

    onAdd(type, path) {
        this.setState({ create: { type, path } });
    }

    onCloseAdd = () => {
        this.setState({ create: null });
    }

    render() {
        if (!this.state.user || this.state.user.name === "guest") {
            return null;
        }

        return (
            <Fragment>
                <If condition={this.state.create}>
                    <CreateModal
                        type={this.state.create.type}
                        path={this.state.create.path}
                        onClose={this.onCloseAdd}
                    />
                </If>
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
                            onClick={() => this.onAdd("a", "/albums")}
                        />
                        <Dropdown.Item
                            icon={(<NodeIcon type="p" />)}
                            text="Person"
                            onClick={() => this.onAdd("p", "/people")}
                        />
                        <Dropdown.Item
                            icon={(<NodeIcon type="l" />)}
                            text="Location"
                            onClick={() => this.onAdd("l", "/locations")}
                        />
                        <Dropdown.Item
                            icon={(<NodeIcon type="c" />)}
                            text="Camera"
                            onClick={() => this.onAdd("c", "/cameras")}
                        />
                    </Dropdown.Menu>
                </Dropdown>
            </Fragment>
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
