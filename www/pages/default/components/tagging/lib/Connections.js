
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Table, Icon } from "semantic-ui-react";
import notification from "lib/notification";
import api from "api.io-client";
import { basename } from "lib/utils";
import { NodeInput } from "components/nodeparts";

class Connections extends Component {
    constructor(props) {
        super(props);

        this.state = {
            persons: {}
        };
    }

    async load() {
        await this.update(this.props);
    }

    async update(props) {
        this.setState({ loading: true, persons: {} });

        try {
            const tags = await api.vfs.list(`${props.node.path}/tags`);

            const persons = {};

            for (const tag of tags) {
                persons[basename(tag.extra.linkPath)] = tag;
            }

            this.setState({
                persons,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to get tags", error);
            notification.add("error", error.message, 10000);
            this.setState({
                persons: {},
                loading: false
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.node !== this.props.node) {
            this.update(nextProps);
        }
    }

    onBlur = () => {
        // TODO: Save person
    }

    onConnect(id, person) {
        const persons = {
            ...this.state.persons,
            [id]: person
        };

        this.setState({ persons });
    }

    onRemove = (face) => {
        this.props.onRemove(face);
    }

    render() {
        return (
            <Table definition compact>
                <Table.Body>
                    <For each="face" index="index" of={this.props.node.attributes.faces}>
                        <Table.Row
                            key={index}
                            className={this.props.theme.connectionItem}
                        >
                            <Table.Cell collapsing>
                                <span title={face.detector === "manual" ? "Manual" : "Automatic"}>
                                    {index + 1}
                                </span>
                            </Table.Cell>
                            <Table.Cell>
                                <NodeInput
                                    value={this.state.persons[face.id] || null}
                                    paths={[ "/people" ]}
                                    onChange={(value) => this.onConnect(face.id, value)}
                                    onBlur={() => this.onBlur(face)}
                                    placeholder="Select a person..."
                                    icon={null}
                                    size="mini"
                                    fluid
                                    transparent
                                />
                            </Table.Cell>
                            <Table.Cell collapsing>
                                <Icon
                                    name="remove"
                                    link
                                    color="red"
                                    onClick={() => this.onRemove(face)}
                                />
                            </Table.Cell>
                        </Table.Row>
                    </For>
                </Table.Body>
            </Table>
        );
    }
}

Connections.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    onRemove: PropTypes.func.isRequired
};

export default Connections;
