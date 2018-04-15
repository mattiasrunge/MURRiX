
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Icon, Image } from "semantic-ui-react";
import { NodeImage } from "components/nodeparts";

class SelectableImageList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            files: [],
            loading: false
        };
    }

    async load() {
        this.addDisposables([
            api.vfs.on("node.update", (path) => {
                if (path.startsWith(this.props.path)) {
                    this.update(this.props);
                }
            }),
            api.vfs.on("node.appendChild", (path) => {
                if (path === this.props.path) {
                    this.update(this.props);
                }
            }),
            api.vfs.on("node.removeChild", (path) => {
                if (path === this.props.path) {
                    this.update(this.props);
                }
            })
        ]);

        await this.update(this.props);
    }

    async update(props) {
        this.setState({ loading: true });

        try {
            const files = await api.vfs.list(props.path, { noerror: true });
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

    componentWillReceiveProps(nextProps) {
        if (nextProps.path !== this.props.path) {
            this.update(nextProps);
        }
    }

    onClick(file) {
        if (this.state.loading) {
            return;
        }

        if (this.props.value.includes(file)) {
            this.props.onChange(this.props.value.filter((f) => f !== file), this.state.files);
        } else if (this.props.single) {
            this.props.onChange([ file ], this.state.files);
        } else {
            this.props.onChange(this.props.value.slice(0).concat(file), this.state.files);
        }
    }

    onSelectAll = () => {
        this.props.onChange(this.state.files, this.state.files);
    }

    onSelectNone = () => {
        this.props.onChange([], this.state.files);
    }

    render() {
        return (
            <div className={this.props.className}>
                <If condition={!this.props.single}>
                    <div className={this.props.theme.selectableImageListButtons}>
                        <a
                            className={this.props.value.length === 0 || this.state.loading ? this.props.theme.disabled : ""}
                            onClick={this.onSelectNone}
                        >
                            Select none
                        </a>
                        <a
                            className={this.props.value.length === this.state.files.length || this.state.loading ? this.props.theme.disabled : ""}
                            onClick={this.onSelectAll}
                        >
                            Select all
                        </a>
                    </div>
                </If>
                <Image.Group className={this.props.theme.selectableImageListContainer}>
                    <For each="file" of={this.state.files}>
                        <span
                            key={file._id}
                            className={this.props.theme.selectableImageContainer}
                            onClick={() => this.onClick(file)}
                        >
                            <NodeImage
                                className={this.props.theme.selectableImage}
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
                                <div className={this.props.theme.selectedImage}>
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
    theme: PropTypes.object,
    className: PropTypes.string,
    path: PropTypes.string.isRequired,
    value: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    single: PropTypes.bool
};

export default SelectableImageList;
