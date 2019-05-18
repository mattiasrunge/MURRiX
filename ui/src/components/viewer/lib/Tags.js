
import React from "react";
import PropTypes from "prop-types";
import { List } from "semantic-ui-react";
import Component from "lib/component";
import { NodeLink } from "components/nodeparts";
import { cmd, event } from "lib/backend";
import format from "lib/format";
import theme from "../theme.module.css";

class Tags extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            nodes: []
        };
    }

    async load() {
        await this.update(this.props);

        this.addDisposables([
            event.on("node.appendChild", this.onNodeUpdated),
            event.on("node.removeChild", this.onNodeUpdated)
        ]);
    }

    onNodeUpdated = (path) => {
        if (path === `${this.props.node.path}/tags`) {
            this.update(this.props);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.node !== prevProps.node) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ loading: true });

        try {
            const nodes = await cmd.list(`${props.node.path}/tags`, { noerror: true });

            for (const node of nodes) {
                node.age = await cmd.age(node.path, props.node.attributes.time);
            }

            !this.disposed && this.setState({
                nodes,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load tags", error, 10000);
            !this.disposed && this.setState({
                nodes: [],
                loading: false
            });
        }
    }

    render() {
        return (
            <If condition={this.state.nodes.length > 0}>
                <List.Item>
                    <List.Icon size="big" name="user" />
                    <List.Content>
                        <List className={theme.sidebarListNested}>
                            <For each="node" of={this.state.nodes}>
                                <List.Item key={node.path}>
                                    <NodeLink node={node} />
                                    {" "}
                                    <small>{format.age(node.age)}</small>
                                </List.Item>
                            </For>
                        </List>
                    </List.Content>
                </List.Item>
            </If>
        );
    }
}

Tags.propTypes = {
    node: PropTypes.object.isRequired
};

export default Tags;