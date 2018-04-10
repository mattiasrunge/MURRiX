
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import format from "lib/format";
import Component from "lib/component";
import notification from "lib/notification";
import utils from "lib/utils";
import api from "api.io-client";
import { Image, Loader, Header, Button } from "semantic-ui-react";
import { CreateModal, EditModal, RemoveModal } from "components/edit";
import Text from "./lib/Text";
import Thumbnail from "./lib/Thumbnail";

class Media extends Component {
    constructor(props) {
        super(props);

        this.state = {
            days: [],
            loading: false,
            addText: false,
            editNode: false,
            removeNode: false
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

    onRemoveNode = (node) => {
        this.setState({ removeNode: node });
    }

    onCloseRemove = () => {
        this.setState({ removeNode: false });
    }

    render() {
        return (
            <div className={this.props.theme.mediaContainer}>
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
                        className={this.props.theme.mediaAddText}
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
                                <Text
                                    key={text._id}
                                    theme={this.props.theme}
                                    node={text}
                                    onRemove={this.props.node.editable ? this.onRemoveNode : null}
                                    onEdit={this.props.node.editable ? this.onEditNode : null}
                                />
                            </For>
                            <Image.Group className={this.props.theme.mediaImageGroup}>
                                <For each="file" of={day.files}>
                                    <Thumbnail
                                        key={file._id}
                                        theme={this.props.theme}
                                        node={file}
                                        parentNode={this.props.node}
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
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Media;
