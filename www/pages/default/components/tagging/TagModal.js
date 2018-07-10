
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Modal, Button } from "semantic-ui-react";
import TagFile from "./TagFile";

class TagModal extends Component {
    render() {
        return (
            <Modal
                open
                onClose={this.props.onClose}
                style={{ marginTop: 0 }}
                size="large"
            >
                <Modal.Header>Tags</Modal.Header>
                <Modal.Content scrolling>
                    <TagFile
                        theme={this.props.theme}
                        node={this.props.node}
                    />
                </Modal.Content>
                <Modal.Actions>
                    <If condition={this.props.onClose}>
                        <Button
                            basic
                            onClick={this.props.onClose}
                        >
                            Close
                        </Button>
                    </If>
                </Modal.Actions>
            </Modal>
        );
    }
}

TagModal.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default TagModal;
