
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Header, Icon, Button, List } from "semantic-ui-react";
import { NodeImage, NodeInput } from "components/nodeparts";
import utils from "lib/utils";

class ListAction extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            list: []
        };

        for (const input of props.action.inputs) {
            this.state[input.name] = null;
        }
    }

    async execute(cmd, env) {
        const [ name, ...params ] = cmd.split(" ");
        const [ ns, func ] = name.split(".");
        const args = params
        .map((param) => {
            if (param[0] === "$") {
                return utils.getValue(env, param.substr(1));
            }

            return param;
        });

        return api[ns][func](...args);
    }

    async load() {
        await this.update();
    }

    async update() {
        this.setState({ loading: true });

        try {
            const env = {
                this: this.props.node,
                ...this.state
            };

            const list = await this.execute(this.props.action.get, env);

            this.setState({ list, loading: false });
        } catch (error) {
            this.logError("Failed to update", error);
            notification.add("error", error.message, 10000);
            this.setState({ list: [], loading: false });
        }
    }

    onSet = (name, value) => {
        this.setState({ [name]: value });
    }

    onRemove = async (e, item) => {
        e.stopPropagation();

        this.setState({ loading: true });

        try {
            const env = {
                this: this.props.node,
                remove: item,
                ...this.state
            };

            await this.execute(this.props.action.remove, env);

            const state = {
                loading: false
            };

            for (const input of this.props.action.inputs) {
                state[input.name] = null;
            }

            this.setState(state);

            await this.update();
        } catch (error) {
            this.logError("Failed to remove", error);
            notification.add("error", error.message, 10000);
            this.setState({ loading: false });
        }
    }

    onAdd = async () => {
        this.setState({ loading: true });

        try {
            const env = {
                this: this.props.node,
                ...this.state
            };

            await this.execute(this.props.action.add, env);

            this.setState({ loading: false });

            await this.update();
        } catch (error) {
            this.logError("Failed to add", error);
            notification.add("error", error.message, 10000);
            this.setState({ loading: false });
        }
    }

    render() {
        return (
            <div>
                <Header as="h2">
                    {this.props.action.label}
                </Header>
                <List divided verticalAlign="middle">
                    <For each="item" of={this.state.list}>
                        <List.Item
                            key={item._id}
                            className={this.props.theme.ListActionSetListItem}
                        >
                            <List.Content className={this.props.theme.ListActionSetListItemContent}>
                                <Icon
                                    className={this.props.theme.ListActionSetListItemClose}
                                    name="close"
                                    title="Remove from list"
                                    link
                                    onClick={(e) => this.onRemove(e, item)}
                                />

                                <NodeImage
                                    path={`${item.path}/profilePicture`}
                                    format={{
                                        width: 28,
                                        height: 28,
                                        type: "image"
                                    }}
                                    rounded
                                    floated="left"
                                />
                                {item.attributes.name}
                            </List.Content>
                        </List.Item>
                    </For>
                </List>
                <For each="input" of={this.props.action.inputs}>
                    <Choose>
                        <When condition={input.type === "node"}>
                            <NodeInput
                                key={input.name}
                                value={this.state[input.name]}
                                onChange={(value) => this.onSet(input.name, value)}
                                paths={input.paths}
                                loading={this.state.loading}
                            />
                        </When>
                    </Choose>
                </For>
                <Button
                    primary
                    content="Add"
                    onClick={this.onAdd}
                    disabled={this.state.loading}
                />
            </div>
        );
    }
}

ListAction.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    action: PropTypes.object.isRequired
};

export default ListAction;
