
import React from "react";
import PropTypes from "prop-types";
import api from "api.io/api.io-client";
import Component from "lib/component";
import uploader from "lib/uploader";
import { Header, Button, Message, Select } from "semantic-ui-react";
import Dropzone from "react-dropzone";
import FileList from "./lib/FileList";

class Upload extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...uploader.getState(),
            folder: "files"
        };
    }

    async load() {
        this.addDisposable(uploader.on("state", async (name, state) => {
            this.setState(state);

            if (state.files.length === 0 && -!state.ongoing) {
                await api.vfs.hiderawfiles(this.props.node.path);
            }
        }));
    }

    onDrop = (files) => {
        uploader.addFiles(`${this.props.node.path}/${this.state.folder}`, files);
    }

    onUpload = () => {
        uploader.start();
    }

    onClear = () => {
        uploader.clear();
    }

    onFolderSelect = (event, input) => {
        this.setState({ folder: input.value });
    }

    isPathAllowed() {
        return !this.state.path || this.state.path === `${this.props.node.path}/${this.state.folder}`;
    }

    render() {
        return (
            <div>
                <Header as="h2">
                    <If condition={this.state.files.length > 0 && this.isPathAllowed()}>
                        <Button
                            className={this.props.theme.uploadButton}
                            loading={this.state.ongoing}
                            onClick={this.onUpload}
                            primary
                        >
                            Start upload
                        </Button>
                        <Button
                            className={this.props.theme.uploadButton}
                            onClick={this.onClear}
                            disabled={this.state.ongoing}
                        >
                            Clear files
                        </Button>
                    </If>
                    <Select
                        className={this.props.theme.folderSelect}
                        required
                        disabled={this.state.files.length > 0}
                        value={this.state.folder}
                        onChange={this.onFolderSelect}
                        options={[
                            { key: "files", value: "files", text: "Media files" },
                            { key: "extra", value: "extra", text: "Extra files" }
                        ]}
                    />
                    Upload files
                    <Header.Subheader>
                        Add content by uploading files
                    </Header.Subheader>
                </Header>
                <Choose>
                    <When condition={!this.isPathAllowed()}>
                        <Message color="yellow">
                            <Message.Header>Upload in progress</Message.Header>
                        </Message>
                    </When>
                    <Otherwise>
                        <If condition={!this.state.ongoing}>
                            <Dropzone onDrop={this.onDrop}>
                                {({ getRootProps, getInputProps, isDragActive, isDragReject }) => (
                                    <section className={`${this.props.theme.uploadDropZone} ${isDragActive ? this.props.theme.uploadDropZoneActive : ""} ${isDragReject ? this.props.theme.uploadDropZoneReject : ""}`}>
                                        <div {...getRootProps()}>
                                            <input {...getInputProps()} />
                                            <p>Drag files here or click to select files to upload</p>
                                        </div>
                                    </section>
                                )}
                            </Dropzone>
                        </If>
                        <If condition={this.state.files.length > 0}>
                            <FileList
                                theme={this.props.theme}
                                files={this.state.files}
                            />
                        </If>
                    </Otherwise>
                </Choose>
            </div>
        );
    }
}

Upload.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

export default Upload;
