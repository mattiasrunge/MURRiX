
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Image, Header, Loader, Menu, Divider } from "semantic-ui-react";
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
            ref: null,
            size: 50
        };
    }

    async load() {
        this.addDisposables([
            // TODO: Synchronize, only handle one update at a time
            event.on("node.update", this.onFileUpdated, { id: "SelectableImageList" }),
            event.on("node.appendChild", this.onFileAdded, { id: "SelectableImageList" }),
            event.on("node.removeChild", this.onFileRemoved, { id: "SelectableImageList" })
        ]);

        await this.update(this.props);
    }

    onFileUpdated = async (event, data) => {
        if (data.path === this.props.path) {
            this.update(this.props);
        } else if (data.path.startsWith(this.props.path)) {
            const index = this.state.files.findIndex(({ path }) => path === data.path);

            if (index !== -1) {
                this.setState({ loading: true });

                const file = await api.resolve(data.path);

                if (this.props.onClickDuplicate) {
                    file.extra = file.extra ?? {};

                    file.extra.duplicates = await api.duplicates(file.path, { count: true });
                }

                const files = this.state.files.slice(0);

                files.splice(index, 1);
                files.push(file);

                utils.sortNodeList(files);

                const selected = this.getSelected(files);
                const days = this.getDays(files);

                this.setState({
                    days,
                    files,
                    loading: false
                });

                this.props.onChange(selected, files);
            }
        }
    }

    onFileAdded = async (event, data) => {
        if (data.path === this.props.path) {
            this.setState({ loading: true });

            const file = await api.resolve(data.extra.childId);

            if (this.props.onClickDuplicate) {
                file.extra = file.extra ?? {};

                file.extra.duplicates = await api.duplicates(file.path, { count: true });
            }

            const files = [ file, ...this.state.files ];

            utils.sortNodeList(files);

            const selected = this.getSelected(files);
            const days = this.getDays(files);

            this.setState({
                days,
                files,
                loading: false
            });

            this.props.onChange(selected, files);
        }
    }

    onFileRemoved = async (event, data) => {
        if (data.path === this.props.path) {
            this.setState({ loading: true });

            const files = this.state.files.filter(({ _id }) => _id !== data.extra.childId);

            utils.sortNodeList(files);

            const selected = this.getSelected(files);
            const days = this.getDays(files);

            this.setState({
                days,
                files,
                loading: false
            });

            this.props.onChange(selected, files);
        }
    }

    getDays(files) {
        let days = {};

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

    getSelected(files) {
        const selected = this.props.value
        .map((node) => files.find((f) => f._id === node._id))
        .filter((node) => node);

        if (this.props.single && selected.length === 0 && files.length > 0) {
            selected.push(files[0]);
        }

        return selected;
    }

    async update(props) {
        if (this.state.loading) {
            return this.setState({ pending: true });
        }

        this.setState({ loading: true });

        try {
            const files = await api.list(props.path, {
                noerror: true,
                duplicates: !!this.props.onClickDuplicate
            });

            utils.sortNodeList(files);

            const selected = this.getSelected(files);
            const days = this.getDays(files);

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

    onSelectAllDuplicates = () => {
        const duplicates = this.state.files.filter(({ extra }) => extra.duplicates.length);
        this.props.onChange(duplicates, this.state.files);
    }

    onSelectDay = (day) => {
        const selected = [ ...new Set([ ...this.props.value, ...day.files ]) ];
        selected.sort((a, b) => this.state.files.indexOf(a) - this.state.files.indexOf(b));

        this.props.onChange(selected, this.state.files);
    }

    onDeselectDay = (day) => {
        const selected = this.props.value.slice(0).filter((file) => !day.files.includes(file));
        selected.sort((a, b) => this.state.files.indexOf(a) - this.state.files.indexOf(b));

        this.props.onChange(selected, this.state.files);
    }

    onSelectSmall = () => {
        this.setState({ size: 50 });
    }

    onSelectLarge = () => {
        this.setState({ size: 216 });
    }

    onRef = (ref) => {
        this.setState({ ref });
    }

    render() {
        if (this.state.ref && this.props.single) {
            const index = this.state.files.indexOf(this.props.value[0]);

            if (index !== -1) {
                const offset = (index * (this.state.size + 1)) + ((this.state.size + 1) / 2);
                const scrollTo = offset - (this.state.ref.offsetWidth / 2);

                this.state.ref.scrollTo(scrollTo, 0);
            }
        }

        const duplicates = this.state.files.filter(({ extra }) => extra?.duplicates?.length).length;

        return (
            <div className={this.props.className} ref={this.onRef}>
                <If condition={!this.props.single}>
                    <Menu size="mini">
                        <Menu.Menu position="right">
                            <Menu.Item
                                icon="grid layout"
                                active={this.state.size === 50}
                                onClick={this.onSelectSmall}
                            />

                            <Menu.Item
                                icon="block layout"
                                active={this.state.size !== 50}
                                onClick={this.onSelectLarge}
                            />
                        </Menu.Menu>
                    </Menu>
                    <div className={theme.selectableImageListButtons}>
                        <span>
                            Select:
                        </span>
                        <a
                            className={this.props.value.length === 0 || this.state.loading ? theme.disabled : ""}
                            onClick={this.onSelectNone}
                        >
                            None
                        </a>
                        <span>&#124;</span>
                        <a
                            className={this.props.value.length === this.state.files.length || this.state.loading ? theme.disabled : ""}
                            onClick={this.onSelectAll}
                        >
                            All
                        </a>
                        <If condition={duplicates}>
                            <span>&#124;</span>
                            <a
                                className={this.state.loading ? theme.disabled : ""}
                                onClick={this.onSelectAllDuplicates}
                            >
                                Duplicates
                            </a>
                        </If>
                    </div>
                </If>

                <If condition={this.state.loading}>
                    <Loader active>Loading...</Loader>
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
                                    size={this.state.size}
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
                                        <span className={theme.mediaDaySelect}>
                                            <a
                                                className={this.state.loading ? theme.disabled : ""}
                                                onClick={() => this.onSelectDay(day)}
                                            >
                                                Select
                                            </a>
                                            <span>&#124;</span>
                                            <a
                                                className={this.state.loading ? theme.disabled : ""}
                                                onClick={() => this.onDeselectDay(day)}
                                            >
                                                Deselect
                                            </a>
                                        </span>
                                        {format.displayTimeDay(day.time)}
                                    </Header>
                                </If>
                                <Divider />
                                <Image.Group className={theme.selectableImageListContainer}>
                                    <For each="file" of={day.files}>
                                        <SelectableImage
                                            key={file._id}
                                            file={file}
                                            selected={this.props.value.includes(file)}
                                            onClick={this.onClick}
                                            onClickDuplicate={this.props.onClickDuplicate}
                                            size={this.state.size}
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
    single: PropTypes.bool,
    onClickDuplicate: PropTypes.func
};

export default SelectableImageList;
