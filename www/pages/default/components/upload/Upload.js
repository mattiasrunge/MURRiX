
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import uploader from "lib/uploader";
import { Header, Button, Message } from "semantic-ui-react";
import Dropzone from "react-dropzone";
import FileList from "./lib/FileList";

class Upload extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...uploader.getState()
        };
    }

    async load() {
        this.addDisposable(uploader.on("state", (name, state) => this.setState(state)));
    }

    onDrop = (files) => {
        uploader.addFiles(`${this.props.node.path}/files`, files);
    }

    onUpload = () => {
        uploader.start();
    }

    onClear = () => {
        uploader.clear();
    }

    isPathAllowed() {
        return !this.state.path || this.state.path === `${this.props.node.path}/files`;
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
                            <Dropzone
                                onDrop={this.onDrop}
                                className={this.props.theme.uploadDropZone}
                                activeClassName={this.props.theme.uploadDropZoneActive}
                                rejectClassName={this.props.theme.uploadDropZoneReject}
                            >
                                Drag files here or click to select files to upload
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
