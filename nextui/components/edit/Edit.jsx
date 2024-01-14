
import React from "react";
import PropTypes from "prop-types";
import { Header } from "semantic-ui-react";
import { api } from "lib/backend";
import EditForm from "./lib/EditForm";

const Edit = ({ node }) => {
    const [ loading, setLoading ] = React.useState(false);

    const onSave = React.useCallback(async (attributes) => {
        setLoading(true);

        try {
            await api.update(node.path, attributes);
        } catch (error) {
            console.error("Failed to save node", error);
        } finally {
            setLoading(false);
        }
    }, [ node ]);

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
                attributes={node.attributes}
                type={node.properties.type}
                loading={loading}
                setAttributes={onSave}
            />
        </div>
    );
};

Edit.propTypes = {
    node: PropTypes.object.isRequired
};

export default Edit;
