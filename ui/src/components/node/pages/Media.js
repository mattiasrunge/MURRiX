
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { withRouter } from "react-router-dom";
import { Image, Loader, Header, Button } from "semantic-ui-react";
import format from "lib/format";
import Component from "lib/component";
import notification from "lib/notification";
import utils from "lib/utils";
import { cmd, event } from "lib/backend";
import { CreateModal, EditModal, RemoveModal } from "components/edit";
import { Viewer } from "components/viewer";
import Text from "./lib/Text";
import Thumbnail from "./lib/Thumbnail";
import theme from "../theme.module.css";

class Media extends Component {
    constructor(props) {
        super(props);

        this.state = {
            days: [],
            loading: false,
            addText: false,
            editNode: false,
            removeNode: false,
            files: []
        };
    }

    async load() {
        this.addDisposables([
            event.on("node.update", (event, path) => {
                if (path.startsWith(this.props.node.path)) {
                    this.update();
                }
            }),
            event.on("node.appendChild", this.onNodeUpdated),
            event.on("node.removeChild", this.onNodeUpdated)
        ]);

        await this.update();
    }

    onNodeUpdated = (event, path) => {
        if (path === `${this.props.node.path}/files` ||
            path === `${this.props.node.path}/texts`) {
            this.update();
        }
    }

    async getDays() {
        const files = await cmd.list(`${this.props.node.path}/files`);
        const texts = await cmd.list(`${this.props.node.path}/texts`);
        const users = await cmd.users();

        utils.sortNodeList(texts);
        utils.sortNodeList(files);

        let days = {};

        for (const text of texts) {
            const user = users.find((user) => user.attributes.uid === text.properties.birthuid);

            text.name = user ? user.attributes.name : "Unknown";

            const day = text.attributes.time ? moment.utc(text.attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

            days[day] = days[day] || { texts: [], files: [], time: text.attributes.time };
            days[day].texts.push(text);
        }

        for (const file of files) {
            const day = file.attributes.time ? moment.utc(file.attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

            days[day] = days[day] || { texts: [], files: [], time: file.attributes.time };
            days[day].files.push(file);
        }

        days = Object.keys(days).map((key) => days[key]);

        days.sort((a, b) => {
            if (!a.time) {
                return -1;
            } else if (!b.time) {
                return 1;
            }

            return a.time.timestamp - b.time.timestamp;
        });

        return { days, files };
    }

    async update() {
        this.setState({ loading: true });

        try {
            const { days, files } = await this.getDays();

            !this.disposed && this.setState({ days, files, loading: false });
        } catch (error) {
            this.logError("Failed to load media", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ days: [], files: [], loading: false });
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

    onSelectNode = (selected) => {
        if (selected) {
            this.props.history.push(`/node${this.props.node.path}/_/media${selected.path}`);
        } else {
            this.props.history.push(`/node${this.props.node.path}/_/media`);
        }
    }

    getSelectedPath() {
        const [ , path ] = this.props.location.pathname.split("/_/media");

        return path;
    }

    render() {
        const selectedPath = this.getSelectedPath();

        return (
            <div className={theme.mediaContainer}>
                <If condition={selectedPath && this.state.files.length > 0}>
                    <Viewer
                        path={selectedPath}
                        onSelect={this.onSelectNode}
                        nodes={this.state.files}
                    />
                </If>
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
                    content="Loading images..."
                    inline="centered"
                />
                <div>
                    <For each="day" of={this.state.days}>
                        <div
                            key={day.time ? day.time.timestamp : 0}
                            className={theme.mediaDay}
                        >
                            <If condition={day.time && day.time.timestamp}>
                                <Header as="h3">
                                    {format.displayTimeDay(day.time)}
                                </Header>
                            </If>
                            <For each="text" of={day.texts}>
                                <Text
                                    key={text._id}
                                    theme={theme}
                                    node={text}
                                    onRemove={this.props.node.editable ? this.onRemoveNode : null}
                                    onEdit={this.props.node.editable ? this.onEditNode : null}
                                />
                            </For>
                            <Image.Group className={theme.mediaImageGroup}>
                                <For each="file" of={day.files}>
                                    <Thumbnail
                                        key={file._id}
                                        theme={theme}
                                        node={file}
                                        parentNode={this.props.node}
                                        onClick={this.onSelectNode}
                                    />
                                </For>
                            </Image.Group>
                        </div>
                    </For>
                </div>
            </div>
        );
    }
}

Media.propTypes = {
    node: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(Media);
