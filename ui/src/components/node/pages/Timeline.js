
import React from "react";
import PropTypes from "prop-types";
import { Loader, Button } from "semantic-ui-react";
import Component from "lib/component";
import { cmd, event } from "lib/backend";
import notification from "lib/notification";
import { CreateModal, EditModal, RemoveModal } from "components/edit";
import TimelineText from "./lib/TimelineText";
import TimelineTime from "./lib/TimelineTime";
import theme from "../theme.module.css";

class Timeline extends Component {
    constructor(props) {
        super(props);

        this.state = {
            texts: [],
            loading: false,
            addText: false,
            editNode: false,
            removeNode: false
        };
    }

    async load() {
        this.addDisposables([
            event.on("node.update", (path) => {
                if (path.startsWith(this.props.node.path)) {
                    this.update();
                }
            }),
            event.on("node.appendChild", this.onNodeUpdated),
            event.on("node.removeChild", this.onNodeUpdated)
        ]);

        await this.update();
    }

    onNodeUpdated = (path) => {
        if (path === `${this.props.node.path}/texts`) {
            this.update(this.props);
        }
    }

    async update() {
        this.setState({ loading: true });

        try {
            const texts = await cmd.list(`${this.props.node.path}/texts`);

            texts.sort((a, b) => {
                if (!a.attributes.time) {
                    return -1;
                } else if (!b.attributes.time) {
                    return 1;
                }

                return a.attributes.time.timestamp - b.attributes.time.timestamp;
            });

            !this.disposed && this.setState({ texts, loading: false });
        } catch (error) {
            this.logError("Failed to load media", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ texts: [], loading: false });
        }
    }

    onAddText = () => {
        this.setState({ addText: true });
    }

    onCloseAddText = () => {
        this.setState({ addText: false });
    }

    onEditNode = (node) => {
        this.setState({ editNode: node });
    }

    onCloseEdit = () => {
        this.setState({ editNode: false });
    }

    onRemoveNode = (node) => {
        this.setState({ removeNode: node });
    }

    onCloseRemove = () => {
        this.setState({ removeNode: false });
    }

    render() {
        return (
            <div className={theme.timelineContainer}>
                <If condition={this.props.node.editable}>
                    <If condition={this.state.addText}>
                        <CreateModal
                            type="t"
                            path={`${this.props.node.path}/texts`}
                            onClose={this.onCloseAddText}
                            attributes={{
                                name: "text",
                                type: "generic"
                            }}
                            gotoNew={false}
                        />
                    </If>
                    <If condition={this.state.editNode}>
                        <EditModal
                            node={this.state.editNode}
                            onClose={this.onCloseEdit}
                        />
                    </If>
                    <If condition={this.state.removeNode}>
                        <RemoveModal
                            node={this.state.removeNode}
                            onClose={this.onCloseRemove}
                        />
                    </If>
                    <Button
                        className={theme.mediaAddText}
                        floated="right"
                        size="small"
                        icon="add"
                        circular
                        primary
                        title="Add text"
                        onClick={this.onAddText}
                    />
                </If>
                <Loader
                    active={this.state.loading}
                    className={theme.mediaLoader}
                    content="Loading timeline..."
                    inline="centered"
                />
                <table className={theme.timelineTable}>
                    <tbody>
                        <For each="node" of={this.state.texts}>
                            <tr
                                key={node._id}
                                className={theme.timelineRow}
                            >
                                <td className={theme.timelineTime}>
                                    <TimelineTime
                                        theme={theme}
                                        time={node.attributes.time}
                                    />
                                </td>
                                <td className={theme.timelineItem}>
                                    <TimelineText
                                        theme={theme}
                                        node={node}
                                        onRemove={this.props.node.editable ? this.onRemoveNode : null}
                                        onEdit={this.props.node.editable ? this.onEditNode : null}
                                    />
                                </td>
                            </tr>
                        </For>
                    </tbody>
                </table>
            </div>
        );
    }
}

Timeline.propTypes = {
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Timeline;
