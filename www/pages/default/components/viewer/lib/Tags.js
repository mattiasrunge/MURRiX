
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { List } from "semantic-ui-react";
import { NodeLink } from "components/nodeparts";
import api from "api.io-client";
import format from "lib/format";

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
            api.vfs.on("node.appendChild", (path) => {
                if (path === `${this.props.node.path}/tags`) {
                    this.update(this.props);
                }
            }),
            api.vfs.on("node.removeChild", (path) => {
                if (path === `${this.props.node.path}/tags`) {
                    this.update(this.props);
                }
            })
        ]);
    }

    componentDidUpdate(prevProps) {
        if (this.props.node !== prevProps.node) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ loading: true });

        try {
            const nodes = await api.vfs.list(`${props.node.path}/tags`, { noerror: true });

            for (const node of nodes) {
                node.age = await api.murrix.age(node.path, props.node.attributes.time);
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
                        <List className={this.props.theme.sidebarListNested}>
                            <For each="node" of={this.state.nodes}>
                                <List.Item key={node.path}>
                                    <NodeLink node={node} />
                                    {" "}
                                    <small>({format.age(node.age)})</small>
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
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

export default Tags;
