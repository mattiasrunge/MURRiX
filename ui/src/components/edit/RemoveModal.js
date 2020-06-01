
import React from "react";
import PropTypes from "prop-types";
import { Modal, Button } from "semantic-ui-react";
import Component from "lib/component";
import { api } from "lib/backend";
import notification from "lib/notification";

class RemoveModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            removing: false
        };
    }

    onRemove = async () => {
        this.setState({ removing: true });

        try {
            await api.unlink(this.props.node.path);

            !this.disposed && this.setState({ removing: false });
            this.props.onClose();
        } catch (error) {
            this.logError("Failed to remove node", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ removing: false });
        }
    }

    render() {
        return (
            <Modal
                open
                onClose={this.props.onClose}
                style={{ marginTop: 0 }}
                size="small"
            >
                <Modal.Header>Remove</Modal.Header>
                <Modal.Content scrolling>
                    <p>
                        Are you sure you want to remove <strong>{this.props.node.attributes.name}</strong>?
                    </p>
                </Modal.Content>
                <Modal.Actions>
                    <If condition={this.props.onClose}>
                        <Button
                            basic
                            onClick={this.props.onClose}
                            disabled={this.state.removing}
                        >
                            Cancel
                        </Button>
                    </If>
                    <Button
                        negative
                        type="submit"
                        loading={this.state.removing}
                        onClick={this.onRemove}
                    >
                        Remove
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

RemoveModal.propTypes = {
    node: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default RemoveModal;
