
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import format from "lib/format";
import Component from "lib/component";
import notification from "lib/notification";
import utils from "lib/utils";
import api from "api.io-client";
import { Image, Loader, Header, Button, Icon } from "semantic-ui-react";
import { NodeImage } from "components/nodeparts";
import { FileIcon } from "components/upload";
import { CreateModal, EditModal } from "components/edit";

class Media extends Component {
    constructor(props) {
        super(props);

        this.state = {
            days: [],
            loading: false,
            addText: false,
            editNode: false,
            format: {
                width: 222,
                height: 222,
                type: "image"
            }
        };
    }

    async load() {
        this.addDisposables([
            api.vfs.on("node.update", (path) => {
                if (path.startsWith(this.props.node.path)) {
                    this.update();
                }
            }),
            api.vfs.on("node.appendChild", (path) => {
                if (path === `${this.props.node.path}/files` ||
                    path === `${this.props.node.path}/texts`) {
                    this.update();
                }
            }),
            api.vfs.on("node.removeChild", (path) => {
                if (path === `${this.props.node.path}/files` ||
                    path === `${this.props.node.path}/texts`) {
                    this.update();
                }
            })
        ]);

        await this.update();
    }

    async getDays() {
        const files = await api.vfs.list(`${this.props.node.path}/files`);
        const texts = await api.vfs.list(`${this.props.node.path}/texts`);
        const users = await api.vfs.users();

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

        return days;
    }

    async update() {
        this.setState({ loading: true });

        try {
            const days = await this.getDays();

            !this.disposed && this.setState({ days, loading: false });
        } catch (error) {
            this.logError("Failed to load media", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ days: [], loading: false });
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

    render() {
        return (
            <div className={this.props.theme.mediaContainer}>
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
                <Button
                    className={this.props.theme.mediaAddText}
                    floated="right"
                    size="small"
                    icon="add"
                    circular
                    primary
                    title="Add text"
                    onClick={this.onAddText}
                />
                <Loader
                    active={this.state.loading}
                    className={this.props.theme.mediaLoader}
                    content="Loading images..."
                    inline="centered"
                />
                <div>
                    <For each="day" of={this.state.days}>
                        <div
                            key={day.time ? day.time.timestamp : 0}
                            className={this.props.theme.mediaDay}
                        >
                            <If condition={day.time && day.time.timestamp}>
                                <Header as="h3">
                                    {format.displayTimeDay(day.time)}
                                </Header>
                            </If>
                            <For each="text" of={day.texts}>
                                <blockquote key={text._id}>
                                    <p>
                                        {text.attributes.text}
                                    </p>
                                    <footer>
                                        Written by <cite title="By">{text.name}</cite> on {format.datetimeUtc(text.attributes.time.timestamp)}
                                        <Icon
                                            className={this.props.theme.mediaEditText}
                                            name="edit"
                                            color="grey"
                                            title="Edit"
                                            link
                                            onClick={() => this.onEditNode(text)}
                                        />
                                    </footer>
                                </blockquote>
                            </For>
                            <Image.Group
                                className={this.props.theme.mediaImageGroup}
                            >
                                <For each="file" of={day.files}>
                                    <span
                                        key={file._id}
                                        className={this.props.theme.mediaImageContainer}
                                    >
                                        <NodeImage
                                            className={this.props.theme.mediaImage}
                                            title={file.attributes.name}
                                            path={file.path}
                                            format={this.state.format}
                                            lazy
                                        />
                                        <FileIcon
                                            type={file.attributes.mimetype}
                                            className={this.classNames(this.props.theme.mediaImageTypeIcon, "image")}
                                        />
                                    </span>
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
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Media;
