
import React from "react";
import PropTypes from "prop-types";
import { Icon, Image } from "semantic-ui-react";
import Component from "lib/component";
import { cmd, event } from "lib/backend";
import notification from "lib/notification";
import { NodeImage } from "components/nodeparts";
import theme from "./theme.module.css";

class SelectableImageList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            files: [],
            loading: false,
            ref: null
        };
    }

    async load() {
        this.addDisposables([
            event.on("node.update", (path) => {
                if (path.startsWith(this.props.path)) {
                    this.update(this.props);
                }
            }, { id: "SelectableImageList" }),
            event.on("node.appendChild", this.onNodeUpdated, { id: "SelectableImageList" }),
            event.on("node.removeChild", this.onNodeUpdated, { id: "SelectableImageList" })
        ]);

        await this.update(this.props);
    }

    onNodeUpdated = (path) => {
        if (path === this.props.path) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ loading: true });

        try {
            const files = await cmd.list(props.path, { noerror: true });
            const selected = this.props.value
            .map((node) => files.find((f) => f._id === node._id))
            .filter((node) => node);

            if (this.props.single && selected.length === 0 && files.length > 0) {
                selected.push(files[0]);
            }

            this.setState({
                files,
                loading: false
            });

            this.props.onChange(selected, files);
        } catch (error) {
            this.logError("Failed to load files", error);
            notification.add("error", error.message, 10000);
            this.setState({
                files: [],
                loading: false
            });

            this.onSelectNone();
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.path !== this.props.path) {
            this.update(this.props);
        }
    }

    onClick(file) {
        if (this.state.loading) {
            return;
        }

        let selected = [];

        if (this.props.value.includes(file)) {
            selected = this.props.value.filter((f) => f !== file);
        } else if (this.props.single) {
            selected = [ file ];
        } else {
            selected = this.props.value.slice(0).concat(file);
        }

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
                <Image.Group
                    className={theme.selectableImageListContainer}
                >
                    <For each="file" of={this.state.files}>
                        <span
                            key={file._id}
                            className={theme.selectableImageContainer}
                            onClick={() => this.onClick(file)}
                        >
                            <NodeImage
                                className={theme.selectableImage}
                                title={file.attributes.name}
                                path={file.path}
                                format={{
                                    width: 50,
                                    height: 50,
                                    type: "image"
                                }}
                                lazy
                            />
                            <If condition={this.props.value.includes(file)}>
                                <div className={theme.selectedImage}>
                                    <Icon name="check" />
                                </div>
                            </If>
                        </span>
                    </For>
                </Image.Group>
            </div>
        );
    }
}

SelectableImageList.propTypes = {
    className: PropTypes.string,
    path: PropTypes.string.isRequired,
    value: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    single: PropTypes.bool
};

export default SelectableImageList;
