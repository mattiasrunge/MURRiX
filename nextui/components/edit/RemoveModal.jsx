
import React from "react";
import PropTypes from "prop-types";
import { Modal, Button } from "semantic-ui-react";
import { NotificationManager } from "react-notifications";
import { api } from "lib/backend";
import theme from "./theme.module.css";

const RemoveModal = ({ node, onClose }) => {
    const [ loading, setLoading ] = React.useState(false);

    const onRemove = React.useCallback(async () => {
        setLoading(true);

        try {
            await api.unlink(node.path);

            onClose();
        } catch (error) {
            console.error("Failed to remove node", error);
            NotificationManager.error(`Failed to remove node, ${error.message}`);
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
            <Modal.Header>Remove</Modal.Header>
            <Modal.Content scrolling>
                <p>
                    Are you sure you want to remove <strong>{node.attributes.name}</strong>?
                </p>
            </Modal.Content>
            <Modal.Actions>
                <If condition={onClose}>
                    <Button
                        basic
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </If>
                <Button
                    negative
                    type="submit"
                    loading={loading}
                    onClick={onRemove}
                >
                    Remove
                </Button>
            </Modal.Actions>
        </Modal>
    );
};

RemoveModal.propTypes = {
    node: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default RemoveModal;
