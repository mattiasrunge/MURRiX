
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Dropdown } from "semantic-ui-react";
import notification from "lib/notification";
import api from "api.io-client";

class ActionMenu extends Component {
    onRotateRight = async () => {
        try {
            await api.media.rotate(this.props.node.path, -90);
        } catch (error) {
            this.logError("Failed to rotate right", error);
            notification.add("error", error.message, 10000);
        }
    }

    onRotateLeft = async () => {
        try {
            await api.media.rotate(this.props.node.path, 90);
        } catch (error) {
            this.logError("Failed to rotate right", error);
            notification.add("error", error.message, 10000);
        }
    }

    onMirror = async () => {
        try {
            await api.media.mirror(this.props.node.path);
        } catch (error) {
            this.logError("Failed to mirror", error);
            notification.add("error", error.message, 10000);
        }
    }

    render() {
        return (
            <If condition={this.props.node.editable}>
                <Dropdown
                    icon={{
                        name: "setting",
                        size: "large",
                        link: true
                    }}
                    className={this.props.theme.sidebarEditIcon}
                    direction="left"
                >
                    <Dropdown.Menu>
                        <If condition={this.props.node.attributes.type === "image" || this.props.node.attributes.type === "video" || this.props.node.attributes.type === "document"}>
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
                            <Dropdown.Item
                                icon="edit"
                                text="Edit"
                                onClick={this.props.onEdit}
                            />
                            <If condition={this.props.onTag}>
                                <Dropdown.Item
                                    icon="user"
                                    text="Tag"
                                    onClick={this.props.onTag}
                                />
                            </If>
                        </If>
                    </Dropdown.Menu>
                </Dropdown>
            </If>
        );
    }
}

ActionMenu.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    onEdit: PropTypes.func.isRequired,
    onTag: PropTypes.func
};

export default ActionMenu;
