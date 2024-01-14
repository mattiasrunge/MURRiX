
import React from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import { Modal } from "semantic-ui-react";
import { NotificationManager } from "react-notifications";
import { api } from "lib/backend";
import EditForm from "./lib/EditForm";
import theme from "./theme.module.css";

const CreateModal = ({ type, path, onClose, attributes, gotoNew }) => {
    const router = useRouter();
    const [ loading, setLoading ] = React.useState(false);

    const onSave = React.useCallback(async (attributes) => {
        setLoading(true);

        try {
            const name = await api.uniquename(path, attributes.name);
            const node = await api.create(path, type, name, attributes);

            gotoNew && router.push(`/node${node.path}/_/settings/share`);
            onClose(node);
        } catch (error) {
            console.error("Failed to create node", error);
            NotificationManager.error(`Failed to create node, ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [ router, type, path, onClose, gotoNew ]);

    return (
        <Modal
            open
            onClose={onClose}
            className={theme.modal}
            size="small"
        >
            <Modal.Header>Add new</Modal.Header>
            <EditForm
                attributes={attributes}
                type={type}
                loading={loading}
                setAttributes={onSave}
                onModalClose={onClose}
            />
        </Modal>
    );
};

CreateModal.defaultProps = {
    attributes: {},
    gotoNew: true
};

CreateModal.propTypes = {
    type: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    attributes: PropTypes.object,
    gotoNew: PropTypes.bool
};

export default CreateModal;
