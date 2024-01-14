
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { withRouter } from "react-router-dom";
import { Image, Loader, Header } from "semantic-ui-react";
import format from "lib/format";
import Component from "lib/component";
import notification from "lib/notification";
import utils from "lib/utils";
import { api } from "lib/backend";
import { Viewer } from "components/viewer";
import Thumbnail from "./lib/Thumbnail";
import theme from "../theme.module.css";

class Tags extends Component {
    constructor(props) {
        super(props);

        this.state = {
            days: [],
            files: [],
            loading: false
        };
    }

    async load() {
        await this.update();
    }

    async getDays() {
        const files = await api.filesbytags(this.props.node.path);

        utils.sortNodeList(files);

        let days = {};

        for (const file of files) {
            const day = file.attributes.time ? moment.utc(file.attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

            days[day] = days[day] || { files: [], time: file.attributes.time };
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
            const files = [];

            days.forEach((day) => day.files.forEach((file) => files.push(file)));

            !this.disposed && this.setState({ files, days, loading: false });
        } catch (error) {
            this.logError("Failed to load media", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ files: [], days: [], loading: false });
        }
    }

    onSelectNode = (selected) => {
        if (selected) {
            this.props.history.push(`/node${this.props.node.path}/_/tags${selected.path}`);
        } else {
            this.props.history.push(`/node${this.props.node.path}/_/tags`);
        }
    }

    getSelectedPath() {
        const [ , path ] = this.props.location.pathname.split("/_/tags");

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

Tags.propTypes = {
    node: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(Tags);
