
import React from "react";
import PropTypes from "prop-types";
import { Header, Button, Message, Select } from "semantic-ui-react";
import Dropzone from "react-dropzone";
import { api } from "lib/backend";
import uploader from "lib/uploader";
import useUploaderState from "hooks/useUploaderState";
import { JobsManager } from "components/jobs";
import FileList from "./lib/FileList";
import theme from "./theme.module.css";

const FOLDERS = [
    { key: "files", value: "files", text: "Media files" },
    { key: "extra", value: "extra", text: "Extra files" }
];

const Upload = ({ node }) => {
    const [ folder, setFolder ] = React.useState("files");
    const uploaderState = useUploaderState();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(async () => {
        if (uploaderState.files.length === 0 && !uploaderState.ongoing) {
            try {
                await api.hiderawfiles(node.path);
            } catch (error) {
                console.error("Failed to hide raw", error);
            }
        }
    }, [ uploaderState, node ]);

    const onDrop = React.useCallback((files) => {
        JobsManager.create("upload", files, `${node.path}/${uploaderState.folder}`);
    }, [ uploaderState, node ]);

    const onUpload = React.useCallback(() => uploader.start(), []);
    const onClear = React.useCallback(() => uploader.clear(), []);
    const onFolderSelect = React.useCallback((e, { value }) => setFolder(value), []);

    const isPathAllowed = React.useMemo(() => !uploaderState.path || uploaderState.path === `${node.path}/${folder}`, [ node, uploaderState, folder ]);

    return (
        <div>
            <Header as="h2">
                <If condition={uploaderState.files.length > 0 && isPathAllowed}>
                    <Button
                        className={theme.uploadButton}
                        loading={uploaderState.ongoing}
                        onClick={onUpload}
                        primary
                    >
                        Start upload
                    </Button>
                    <Button
                        className={theme.uploadButton}
                        onClick={onClear}
                        disabled={uploaderState.ongoing}
                    >
                        Clear files
                    </Button>
                </If>
                <If condition={node.properties.type === "a"}>
                    <Select
                        className={theme.folderSelect}
                        required
                        disabled={uploaderState.files.length > 0}
                        value={folder}
                        onChange={onFolderSelect}
                        options={FOLDERS}
                    />
                </If>
                Upload files
                <Header.Subheader>
                    Add content by uploading files
                </Header.Subheader>
            </Header>
            <Choose>
                <When condition={!isPathAllowed}>
                    <Message color="yellow">
                        <Message.Header>Upload in progress</Message.Header>
                    </Message>
                </When>
                <Otherwise>
                    <If condition={!uploaderState.ongoing}>
                        <Dropzone onDrop={onDrop}>
                            {({ getRootProps, getInputProps, isDragActive, isDragReject }) => (
                                <section className={`${theme.uploadDropZone} ${isDragActive ? theme.uploadDropZoneActive : ""} ${isDragReject ? theme.uploadDropZoneReject : ""}`}>
                                    <div {...getRootProps()}>
                                        <input {...getInputProps()} />
                                        <p>Drag files here or click to select files to upload</p>
                                    </div>
                                </section>
                            )}
                        </Dropzone>
                    </If>
                    <If condition={uploaderState.files.length > 0}>
                        <FileList
                            theme={theme}
                            files={uploaderState.files}
                        />
                    </If>
                </Otherwise>
            </Choose>
        </div>
    );
};

Upload.propTypes = {
    node: PropTypes.object.isRequired
};

export default Upload;
