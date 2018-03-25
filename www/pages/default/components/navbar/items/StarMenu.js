
import React from "react";
import PropTypes from "prop-types";
import api from "api.io-client";
import session from "lib/session";
import Component from "lib/component";
import { Dropdown, Icon } from "semantic-ui-react";

class StarMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            stars: []
        };
    }

    async load() {
        this.addDisposables([
            session.on("update", (event, user) => this.setState({ user })),
            api.vfs.on("node.appendChild", () => this.update()),
            api.vfs.on("node.removeChild", () => this.update())
        ]);

        await this.update();
    }

    async update() {
        const stars = await api.vfs.stars();

        this.setState({ stars });
    }

    goto(node) {
        this.context.router.history.push(`/node${node.path}`);
    }

    render() {
        if (!this.state.user || this.state.user.name === "guest" || this.state.stars.length === 0) {
            return null;
        }

        return (
            <Dropdown
                item
                trigger={(
                    <Icon
                        fitted
                        name="star"
                        style={{ margin: 0 }}
                    />
                )}
                icon={null}
            >
                <Dropdown.Menu fitted="vertically">
                    <For each="node" of={this.state.stars}>
                        <Dropdown.Item
                            key={node._id}
                            text={node.attributes.name}
                            onClick={() => this.goto(node)}
                        />
                    </For>
                </Dropdown.Menu>
            </Dropdown>
        );
    }
}

StarMenu.propTypes = {
    theme: PropTypes.object,
    location: PropTypes.object.isRequired
};

StarMenu.contextTypes = {
    router: PropTypes.object.isRequired
};

export default StarMenu;
