
import React from "react";
import PropTypes from "prop-types";
import { Table, Icon, Header } from "semantic-ui-react";
import Component from "lib/component";
import notification from "lib/notification";
import { api, event } from "lib/backend";
import utils from "lib/utils";
import { NodeInput } from "components/nodeparts";
import theme from "../theme.module.css";

class Connections extends Component {
    constructor(props) {
        super(props);

        this.state = {
            persons: {},
            suggestions: [],
            loading: false,
            saving: false
        };
    }

    async load() {
        this.addDisposables([
            event.on("node.appendChild", this.onNodeUpdated, { id: "TaggingConnections" }),
            event.on("node.removeChild", this.onNodeUpdated, { id: "TaggingConnections" })
        ]);

        await this.update(this.props);
    }

    onNodeUpdated = (event, { path }) => {
        if (path === `${this.props.node.path}/tags`) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ loading: true });

        try {
            const tags = await api.list(`${props.node.path}/tags`);
            const persons = {};

            for (const tag of tags) {
                persons[utils.basename(tag.extra.linkPath)] = tag;
            }

            const tagIds = new Set(tags.map((tag) => tag._id));
            const suggestions = this.props.suggestions.filter(({ _id }) => !tagIds.has(_id));

            this.setState({
                suggestions,
                persons,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to get tags", error);
            notification.add("error", error.message, 10000);
            this.setState({
                suggestions: [],
                persons: {},
                loading: false
            });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.node !== this.props.node) {
            this.update(this.props);
        }
    }

    async onConnect(id, person) {
        this.setState({ saving: true });

        try {
            if (this.state.persons[id]) {
                await api.unlink(`${this.props.node.path}/tags/${id}`);
            }

            if (person) {
                await api.symlink(person.path, `${this.props.node.path}/tags/${id}`);
            }

            this.setState({ saving: false });
        } catch (error) {
            this.logError("Failed to connect person to face", error);
            notification.add("error", error.message, 10000);
            this.setState({ saving: false });
        }
    }

    onRemoveFace = async (face) => {
        this.setState({ saving: true });

        try {
            if (this.state.persons[face.id]) {
                await api.unlink(`${this.props.node.path}/tags/${face.id}`);
            }

            this.props.onRemove(face);

            this.setState({ saving: false });
        } catch (error) {
            this.logError("Failed to remove face", error);
            notification.add("error", error.message, 10000);
            this.setState({ saving: false });
        }
    }

    onPersonAdd = async (person) => {
        this.setState({ saving: true });

        try {
            await api.symlink(person.path, `${this.props.node.path}/tags`);

            this.setState({ saving: false });

            return false;
        } catch (error) {
            this.logError("Failed to connect person", error);
            notification.add("error", error.message, 10000);
            this.setState({ saving: false });
        }
    }

    onRemovePerson = async (person) => {
        this.setState({ saving: true });

        try {
            await api.unlink(person.extra.linkPath);

            this.setState({ saving: false });
        } catch (error) {
            this.logError("Failed to disconnect person", error);
            notification.add("error", error.message, 10000);
            this.setState({ saving: false });
        }
    }

    render() {
        const untagged = Object.keys(this.state.persons)
        .filter((id) => !(this.props.node.attributes.faces || []).some((face) => face.id === id))
        .map((id) => this.state.persons[id]);

        return (
            <div>
                <If condition={(this.props.node.attributes.faces || []).length > 0}>
                    <Header as="h4">Tagged people</Header>
                    <Table definition compact>
                        <Table.Body>
                            <For each="face" index="index" of={this.props.node.attributes.faces || []}>
                                <Table.Row
                                    key={index}
                                    className={theme.connectionItem}
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
                                            placeholder="Who is this..."
                                            disabled={this.state.loading || this.state.saving}
                                            icon={null}
                                            size="small"
                                            fluid
                                            transparent
                                            suggestions={this.state.suggestions}
                                        />
                                    </Table.Cell>
                                    <Table.Cell collapsing>
                                        <Icon
                                            name={this.state.loading ? "spinner" : "remove"}
                                            link
                                            fitted
                                            color={this.state.loading ? null : "red"}
                                            onClick={() => this.onRemoveFace(face)}
                                            loading={this.state.loading}
                                        />
                                    </Table.Cell>
                                </Table.Row>
                            </For>
                        </Table.Body>
                    </Table>
                </If>

                <Header as="h4">People without tags</Header>
                <Table compact>
                    <Table.Body>
                        <Table.Row
                            className={theme.connectionItem}
                        >
                            <Table.Cell colSpan="2">
                                <NodeInput
                                    value={null}
                                    paths={[ "/people" ]}
                                    onChange={(value) => this.onPersonAdd(value)}
                                    placeholder="Add a person..."
                                    disabled={this.state.loading || this.state.saving}
                                    icon={null}
                                    size="small"
                                    fluid
                                    transparent
                                    suggestions={this.state.suggestions}
                                />
                            </Table.Cell>
                        </Table.Row>
                        <For each="person" of={untagged}>
                            <Table.Row
                                key={person._id}
                                className={theme.connectionItem}
                            >
                                <Table.Cell>
                                    <NodeInput
                                        value={person}
                                        paths={[ "/people" ]}
                                        onChange={(value) => this.onPersonChange(person, value)}
                                        placeholder="Add a person..."
                                        disabled={this.state.loading || this.state.saving}
                                        icon={null}
                                        size="small"
                                        fluid
                                        transparent
                                    />
                                </Table.Cell>
                                <Table.Cell collapsing>
                                    <Icon
                                        name={this.state.loading ? "spinner" : "remove"}
                                        link
                                        fitted
                                        color={this.state.loading ? null : "red"}
                                        onClick={() => this.onRemovePerson(person)}
                                        loading={this.state.loading}
                                    />
                                </Table.Cell>
                            </Table.Row>
                        </For>
                    </Table.Body>
                </Table>
            </div>
        );
    }
}

Connections.defaultProps = {
    suggestions: []
};

Connections.propTypes = {
    node: PropTypes.object.isRequired,
    suggestions: PropTypes.array,
    onRemove: PropTypes.func.isRequired
};

export default Connections;
