
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Header } from "semantic-ui-react";
import EditForm from "./lib/EditForm";

class Edit extends Component {
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
        } catch (error) {
            this.logError("Failed to save node", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ saving: false });
        }
    }

    render() {
        return (
            <div>
                <Header
                    as="h2"
                    content="Edit"
                    subheader={{
                        content: "Change attributes"
                    }}
                />
                <EditForm
                    theme={this.props.theme}
                    attributes={this.props.node.attributes}
                    type={this.props.node.properties.type}
                    saving={this.state.saving}
                    onSave={this.onSave}
                />
            </div>
        );
    }
}

Edit.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Edit;
