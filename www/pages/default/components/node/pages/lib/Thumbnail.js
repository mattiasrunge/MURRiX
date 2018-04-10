
/* global window */

import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Dropdown } from "semantic-ui-react";
import { NodeImage } from "components/nodeparts";
import { FileIcon } from "components/upload";
import notification from "lib/notification";
import api from "api.io-client";

class Thumbnail extends Component {
    constructor(props) {
        super(props);

        this.state = {
            format: {
                width: this.props.size,
                height: this.props.size,
                type: "image"
            }
        };
    }

    onProfilePicture = async () => {
        const path = `${this.props.parentNode.path}/profilePicture`;

        try {
            await api.vfs.unlink(path);
        } catch (error) {}

        try {
            await api.vfs.symlink(this.props.node.path, path);
        } catch (error) {
            this.logError("Failed to set profile picture", error);
            notification.add("error", error.message, 10000);
        }
    }

    onDownload = () => {
        window.location = `/media/file/${this.props.node.attributes.diskfilename}/${this.props.node.attributes.name}`;
    }

    onRotateRight = async () => {
        try {
            await api.vfs.rotate(this.props.node.path, -90);
        } catch (error) {
            this.logError("Failed to rotate right", error);
            notification.add("error", error.message, 10000);
        }
    }

    onRotateLeft = async () => {
        try {
            await api.vfs.rotate(this.props.node.path, 90);
        } catch (error) {
            this.logError("Failed to rotate right", error);
            notification.add("error", error.message, 10000);
        }
    }

    onMirror = async () => {
        try {
            await api.vfs.mirror(this.props.node.path);
        } catch (error) {
            this.logError("Failed to mirror", error);
            notification.add("error", error.message, 10000);
        }
    }

    render() {
        return (
            <span className={this.props.theme.mediaImageContainer}>
                <NodeImage
                    className={this.props.theme.mediaImage}
                    title={this.props.node.attributes.name}
                    path={this.props.node.path}
                    format={this.state.format}
                    lazy
                />
                <FileIcon
                    type={this.props.node.attributes.mimetype}
                    className={this.classNames(this.props.theme.mediaImageTypeIcon, "image")}
                />
                <Dropdown
                    icon="setting"
                    className={this.props.theme.mediaImageMenu}
                    direction="left"
                >
                    <Dropdown.Menu>
                        <If condition={this.props.editAllowed}>
                            <Dropdown.Item
                                icon="picture"
                                text="Set as profile picture"
                                onClick={this.onProfilePicture}
                            />
                        </If>
                        <Dropdown.Item
                            icon="download"
                            text="Download"
                            onClick={this.onDownload}
                        />
                        <If condition={this.props.editAllowed}>
                            <Dropdown.Item
                                icon="repeat"
                                text="Rotate right"
                                onClick={this.onRotateRight}
                            />
                        </If>
                        <If condition={this.props.editAllowed}>
                            <Dropdown.Item
                                icon="undo"
                                text="Rotate left"
                                onClick={this.onRotateLeft}
                            />
                        </If>
                        <If condition={this.props.editAllowed}>
                            <Dropdown.Item
                                icon="exchange"
                                text="Mirror"
                                onClick={this.onMirror}
                            />
                        </If>
                    </Dropdown.Menu>
                </Dropdown>
            </span>
        );
    }
}

Thumbnail.defaultProps = {
    size: 216
};

Thumbnail.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    parentNode: PropTypes.object.isRequired,
    editAllowed: PropTypes.bool.isRequired,
    size: PropTypes.number
};

export default Thumbnail;
