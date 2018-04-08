
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Modal } from "semantic-ui-react";
import EditForm from "./lib/EditForm";

class EditModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            saving: false
        };
    }

    onSave = async (attributes) => {
        this.setState({ saving: true });

        try {
            await api.vfs.update(this.props.node.path, attributes);

            !this.disposed && this.setState({ saving: false });
            this.props.onClose();
        } catch (error) {
            this.logError("Failed to save node", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ saving: false });
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
                <Modal.Header>Change</Modal.Header>
                <EditForm
                    theme={this.props.theme}
                    attributes={this.props.node.attributes}
                    type={this.props.node.properties.type}
                    saving={this.state.saving}
                    onSave={this.onSave}
                    onModalClose={this.props.onClose}
                />
            </Modal>
        );
    }
}

EditModal.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default EditModal;
