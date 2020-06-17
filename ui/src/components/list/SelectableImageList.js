
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Image, Header } from "semantic-ui-react";
import Component from "lib/component";
import { api, event } from "lib/backend";
import notification from "lib/notification";
import utils from "lib/utils";
import format from "lib/format";
import theme from "./theme.module.css";
import SelectableImage from "./SelectableImage";

class SelectableImageList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            files: [],
            days: [],
            loading: false,
            pending: false,
            ref: null
        };
    }

    async load() {
        this.addDisposables([
            event.on("node.update", (event, path) => {
                if (path.startsWith(this.props.path)) {
                    this.update(this.props);
                }
            }, { id: "SelectableImageList" }),
            event.on("node.appendChild", this.onNodeUpdated, { id: "SelectableImageList" }),
            event.on("node.removeChild", this.onNodeUpdated, { id: "SelectableImageList" })
        ]);

        await this.update(this.props);
    }

    onNodeUpdated = (event, path) => {
        if (path === this.props.path) {
            this.update(this.props);
        }
    }

    async update(props) {
        if (this.state.loading) {
            return this.setState({ pending: true });
        }

        this.setState({ loading: true });

        try {
            let days = {};
            const files = await api.list(props.path, { noerror: true });

            utils.sortNodeList(files);

            const selected = this.props.value
            .map((node) => files.find((f) => f._id === node._id))
            .filter((node) => node);

            if (this.props.single && selected.length === 0 && files.length > 0) {
                selected.push(files[0]);
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

            this.setState({
                days,
                files,
                loading: false
            });

            this.props.onChange(selected, files);
        } catch (error) {
            this.logError("Failed to load files", error);
            notification.add("error", error.message, 10000);
            this.setState({
                days: [],
                files: [],
                loading: false
            });

            this.onSelectNone();
        }

        if (this.state.pending) {
            this.setState({ pending: false });
            this.update(props);
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.path !== this.props.path) {
            this.update(this.props);
        }
    }

    onClick = (e, file) => {
        if (this.state.loading) {
            return;
        }

        if (this.props.onView && e.shiftKey && e.ctrlKey) {
            return this.props.onView(file, this.state.files);
        }

        let selected = [];

        if (this.props.single || (!e.shiftKey && !e.ctrlKey)) {
            if (this.props.value.includes(file) && this.props.value.length === 1) {
                selected = [];
            } else {
                selected = [ file ];
            }
        } else if (e.ctrlKey) {
            if (this.props.value.includes(file)) {
                selected = this.props.value.filter((f) => f !== file);
            } else {
                selected = this.props.value.slice(0).concat(file);
            }
        } else if (e.shiftKey) {
            if (this.props.value.length === 0) {
                selected = [ file ];
            } else if (this.props.value.length === 1 && this.props.value[0] === file) {
                return;
            } else {
                const fileIndex = this.state.files.indexOf(file);
                const firstIndex = this.state.files.indexOf(this.props.value[0]);
                const lastIndex = this.state.files.indexOf(this.props.value[this.props.value.length - 1]);

                if (fileIndex === firstIndex) {
                    selected = [ file ];
                } else if (fileIndex < firstIndex) {
                    selected = this.state.files.slice(fileIndex, lastIndex + 1);
                } else {
                    selected = this.state.files.slice(firstIndex, fileIndex + 1);
                }
            }
        }

        selected.sort((a, b) => this.state.files.indexOf(a) - this.state.files.indexOf(b));

        this.props.onChange(selected, this.state.files);
    }

    onSelectAll = () => {
        this.props.onChange(this.state.files, this.state.files);
    }

    onSelectNone = () => {
        this.props.onChange([], this.state.files);
    }

    onRef = (ref) => {
        this.setState({ ref });
    }

    render() {
        if (this.state.ref && this.props.single) {
            const index = this.state.files.indexOf(this.props.value[0]);

            if (index !== -1) {
                const offset = (index * 51) + (51 / 2);
                const scrollTo = offset - (this.state.ref.offsetWidth / 2);

                this.state.ref.scrollTo(scrollTo, 0);
            }
        }

        return (
            <div className={this.props.className} ref={this.onRef}>
                <If condition={!this.props.single}>
                    <div className={theme.selectableImageListButtons}>
                        <a
                            className={this.props.value.length === 0 || this.state.loading ? theme.disabled : ""}
                            onClick={this.onSelectNone}
                        >
                            Select none
                        </a>
                        <a
                            className={this.props.value.length === this.state.files.length || this.state.loading ? theme.disabled : ""}
                            onClick={this.onSelectAll}
                        >
                            Select all
                        </a>
                    </div>
                </If>
                <Choose>
                    <When condition={this.props.single}>
                        <Image.Group className={theme.selectableImageListContainer}>
                            <For each="file" of={this.state.files}>
                                <SelectableImage
                                    key={file._id}
                                    file={file}
                                    selected={this.props.value.includes(file)}
                                    onClick={this.onClick}
                                />
                            </For>
                        </Image.Group>
                    </When>
                    <Otherwise>
                        <For each="day" of={this.state.days}>
                            <div
                                key={day.time ? day.time.timestamp : 0}
                                className={theme.mediaDay}
                            >
                                <If condition={day.time && day.time.timestamp}>
                                    <Header as="h5">
                                        {format.displayTimeDay(day.time)}
                                    </Header>
                                </If>
                                <Image.Group className={theme.selectableImageListContainer}>
                                    <For each="file" of={day.files}>
                                        <SelectableImage
                                            key={file._id}
                                            file={file}
                                            selected={this.props.value.includes(file)}
                                            onClick={this.onClick}
                                        />
                                    </For>
                                </Image.Group>
                            </div>
                        </For>
                    </Otherwise>
                </Choose>
            </div>
        );
    }
}

SelectableImageList.propTypes = {
    className: PropTypes.string,
    path: PropTypes.string.isRequired,
    value: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    onView: PropTypes.func,
    single: PropTypes.bool
};

export default SelectableImageList;
