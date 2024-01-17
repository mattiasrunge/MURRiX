
import React from "react";
import PropTypes from "prop-types";
import { Modal } from "semantic-ui-react";
import { NotificationManager } from "react-notifications";
import { api } from "lib/backend";
import EditForm from "./lib/EditForm";
import theme from "./theme.module.css";

const EditModal = ({ node, onClose }) => {
    const [ loading, setLoading ] = React.useState(false);

    const onSave = React.useCallback(async (attributes) => {
        setLoading(true);

        try {
            await api.update(node.path, attributes);
            onClose();
        } catch (error) {
            console.error("Failed to save node", error);
            NotificationManager.error(`Failed to save node, ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [ onClose, node ]);

    return (
        <Modal
            open
            onClose={onClose}
            className={theme.modal}
            size="small"
        >
            <Modal.Header>Change</Modal.Header>
            <EditForm
                attributes={node.attributes}
                type={node.properties.type}
                loading={loading}
                setAttributes={onSave}
                onModalClose={onClose}
            />
        </Modal>
    );
};

EditModal.propTypes = {
    node: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default EditModal;
