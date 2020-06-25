
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Modal } from "semantic-ui-react";
import Component from "lib/component";
import { api } from "lib/backend";
import notification from "lib/notification";
import EditForm from "./lib/EditForm";
import theme from "./theme.module.css";

class CreateModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            saving: false
        };
    }

    onSave = async (attributes) => {
        const attribs = {
            ...attributes,
            ...this.props.attributes
        };

        this.setState({ saving: true });

        try {
            const name = await api.uniquename(this.props.path, attribs.name);
            const node = await api.create(this.props.path, this.props.type, name, attribs);

            !this.disposed && this.setState({ saving: false });

            this.props.gotoNew && this.props.history.push(`/node${node.path}/_/settings/share`);
            this.props.onClose(node);
        } catch (error) {
            this.logError("Failed to save node", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ saving: false });
        }
    }

    onClose = () => {
        this.props.onClose();
    }

    render() {
        return (
            <Modal
                open
                onClose={this.onClose}
                style={{ marginTop: 0 }}
                size="small"
            >
                <Modal.Header>Add new</Modal.Header>
                <EditForm
                    theme={theme}
                    type={this.props.type}
                    saving={this.state.saving}
                    onSave={this.onSave}
                    onModalClose={this.onClose}
                />
            </Modal>
        );
    }
}

CreateModal.defaultProps = {
    attributes: {},
    gotoNew: true
};

CreateModal.propTypes = {
    type: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    attributes: PropTypes.object,
    gotoNew: PropTypes.bool,
    history: PropTypes.object.isRequired
};

export default withRouter(CreateModal);
