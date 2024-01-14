
/* global window */

import React from "react";
import PropTypes from "prop-types";
import { Dropdown } from "semantic-ui-react";
import Component from "lib/component";
import { NodeImage } from "components/nodeparts";
import { FileIcon } from "components/upload";
import notification from "lib/notification";
import { api } from "lib/backend";
import theme from "../../theme.module.css";

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
            await api.unlink(path);
        } catch {}

        try {
            await api.symlink(this.props.node.path, path);
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
            await api.rotate(this.props.node.path, -90);
        } catch (error) {
            this.logError("Failed to rotate right", error);
            notification.add("error", error.message, 10000);
        }
    }

    onRotateLeft = async () => {
        try {
            await api.rotate(this.props.node.path, 90);
        } catch (error) {
            this.logError("Failed to rotate right", error);
            notification.add("error", error.message, 10000);
        }
    }

    onMirror = async () => {
        try {
            await api.mirror(this.props.node.path);
        } catch (error) {
            this.logError("Failed to mirror", error);
            notification.add("error", error.message, 10000);
        }
    }

    onClick = () => {
        this.props.onClick(this.props.node);
    }

    render() {
        return (
            <span
                className={theme.mediaImageContainer}
                onClick={this.onClick}
            >
                <NodeImage
                    className={theme.mediaImage}
                    title={this.props.node.attributes.name}
                    path={this.props.node.path}
                    format={this.state.format}
                    lazy
                />
                <FileIcon
                    type={this.props.node.attributes.mimetype}
                    className={this.classNames(theme.mediaImageTypeIcon)}
                />
                <Dropdown
                    icon="setting"
                    className={theme.mediaImageMenu}
                    direction="left"
                >
                    <Dropdown.Menu>
                        <If condition={this.props.node.editable}>
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
                        <If condition={this.props.node.editable && (this.props.node.attributes.type === "image" || this.props.node.attributes.type === "video" || this.props.node.attributes.type === "document")}>
                            <Dropdown.Item
                                icon="repeat"
                                text="Rotate right"
                                onClick={this.onRotateRight}
                            />
                            <Dropdown.Item
                                icon="undo"
                                text="Rotate left"
                                onClick={this.onRotateLeft}
                            />
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
    node: PropTypes.object.isRequired,
    parentNode: PropTypes.object.isRequired,
    size: PropTypes.number,
    onClick: PropTypes.func.isRequired
};

export default Thumbnail;
