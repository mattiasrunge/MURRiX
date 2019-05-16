
import React from "react";
import PropTypes from "prop-types";
import { Header } from "semantic-ui-react";
import Component from "lib/component";
import { cmd } from "lib/backend";
import notification from "lib/notification";
import EditForm from "./lib/EditForm";
import theme from "./theme.module.css";

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
            await cmd.update(this.props.node.path, attributes);

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
                    theme={theme}
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
    node: PropTypes.object.isRequired
};

export default Edit;
