
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Modal } from "semantic-ui-react";
import EditForm from "./lib/EditForm";

class Create extends Component {
    constructor(props) {
        super(props);

        this.state = {
            saving: false
        };
    }

    onSave = async (attributes) => {
        this.setState({ saving: true });

        try {
            const name = await api.vfs.uniquename(this.props.path, attributes.name);
            const node = await api.vfs.create(this.props.path, this.props.type, name, attributes);

            !this.disposed && this.setState({ saving: false });

            this.context.router.history.push(`/node${node.path}/_/settings/share`);
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
                <Modal.Header>Add new</Modal.Header>
                <EditForm
                    theme={this.props.theme}
                    type={this.props.type}
                    saving={this.state.saving}
                    onSave={this.onSave}
                    onModalClose={this.props.onClose}
                />
            </Modal>
        );
    }
}

Create.propTypes = {
    theme: PropTypes.object,
    type: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired
};

Create.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Create;
