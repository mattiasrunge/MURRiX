
import React from "react";
import PropTypes from "prop-types";
import { Icon, Button, List, Card } from "semantic-ui-react";
import stringTemplate from "template-strings";
import Component from "lib/component";
import { api } from "lib/backend";
import notification from "lib/notification";
import { NodeImage, NodeInput } from "components/nodeparts";
import theme from "../theme.module.css";

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

    async execute(command, env) {
        const [ name, ...params ] = command.split(" ");
        const args = params
        .map((param) => stringTemplate(param, env));

        return api[name](...args);
    }

    async load() {
        await this.update();
    }

    async update() {
        this.setState({ loading: true });

        try {
            const env = {
                node: this.props.node,
                ...this.state
            };

            let list = await this.execute(this.props.action.get, env);

            list = (Array.isArray(list) || !list ? list : [ list ]) || [];

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
                node: this.props.node,
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
                node: this.props.node,
                ...this.state
            };

            await this.execute(this.props.action.add, env);

            const state = {
                loading: false
            };

            for (const input of this.props.action.inputs) {
                state[input.name] = null;
            }

            this.setState(state);

            await this.update();
        } catch (error) {
            this.logError("Failed to add", error);
            notification.add("error", error.message, 10000);
            this.setState({ loading: false });
        }
    }

    render() {
        return (
            <Card>
                <Card.Content>
                    <Card.Header>{this.props.action.label}</Card.Header>
                </Card.Content>
                <Card.Content>
                    <List divided verticalAlign="middle">
                        <For each="item" of={this.state.list}>
                            <List.Item key={item._id}>
                                <List.Content>
                                    <NodeImage
                                        className={theme.actionListItemImage}
                                        path={`${item.path}/profilePicture`}
                                        format={{
                                            width: 28,
                                            height: 28,
                                            type: "image"
                                        }}
                                        rounded
                                    />
                                    {item.attributes.name}
                                    <Icon
                                        className={theme.actionListItemRemove}
                                        name="close"
                                        title="Remove from list"
                                        link
                                        color="red"
                                        onClick={(e) => this.onRemove(e, item)}
                                    />
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
                                    className={theme.actionInput}
                                    size="mini"
                                />
                            </When>
                        </Choose>
                    </For>
                    <Button
                        primary
                        fluid
                        content="Set"
                        size="mini"
                        onClick={this.onAdd}
                        disabled={this.state.loading}
                    />
                </Card.Content>
            </Card>
        );
    }
}

ListAction.propTypes = {
    node: PropTypes.object.isRequired,
    action: PropTypes.object.isRequired
};

export default ListAction;
