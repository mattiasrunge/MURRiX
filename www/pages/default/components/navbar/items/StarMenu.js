
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import api from "api.io-client";
import session from "lib/session";
import Component from "lib/component";
import { Dropdown, Icon } from "semantic-ui-react";
import { NodeImage, NodeIcon } from "components/nodeparts";

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
            session.on("update", async (event, user) => {
                this.setState({ user });
                await this.update();
            }),
            api.vfs.on("node.appendChild", () => this.update()),
            api.vfs.on("node.removeChild", () => this.update())
        ]);

        await this.update();
    }

    async update() {
        if (!this.state.user || this.state.user.name === "guest") {
            return;
        }

        const stars = await api.vfs.stars();

        this.setState({ stars });
    }

    goto(node) {
        this.props.history.push(`/node${node.path}`);
    }

    render() {
        if (!this.state.user || this.state.user.name === "guest" || this.state.stars.length === 0) {
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
                            onClick={() => this.goto(node)}
                        >
                            <NodeImage
                                className="image"
                                path={`${node.path}/profilePicture`}
                                format={{
                                    width: 18,
                                    height: 18,
                                    type: "image"
                                }}
                                rounded
                                floated="right"
                            />
                            <div className={this.props.theme.starMenuText}>
                                <NodeIcon
                                    type={node.properties.type}
                                />
                                {node.attributes.name}
                            </div>
                        </Dropdown.Item>
                    </For>
                </Dropdown.Menu>
            </Dropdown>
        );
    }
}

StarMenu.propTypes = {
    theme: PropTypes.object,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(StarMenu);
