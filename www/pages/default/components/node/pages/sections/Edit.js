
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Header, Form, Button } from "semantic-ui-react";

class Edit extends Component {
    constructor(props) {
        super(props);

        this.state = {
            name: this.props.node.attributes.name,
            description: this.props.node.attributes.description,
            labels: this.props.node.attributes.labels,
            loading: false
        };
    }

    onSubmit = async () => {
        this.setState({ loading: true });

        try {
            await api.vfs.update(this.props.node.path, {
                name: this.state.name,
                description: this.state.description,
                labels: this.state.labels
            });

            !this.disposed && this.setState({ loading: false });
        } catch (error) {
            this.logError("Failed to save node", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ loading: false });
        }
    }

    onNameChange = (e, { value }) => {
        this.setState({ name: value });
    }

    onDescriptionChange = (e, { value }) => {
        this.setState({ description: value });
    }

    onLabelsChange = (e, { value }) => {
        this.setState({ labels: value });
    }

    labelRender = (item, index, defaultLabelProps) => ({
        content: item.text,
        color: "blue",
        size: "mini",
        ...defaultLabelProps
    })

    onReset = () => {
        this.setState({
            name: this.props.node.attributes.name,
            description: this.props.node.attributes.description,
            labels: this.props.node.attributes.labels
        });
    }

    render() {
        const options = this.state.labels.map((label) => ({
            value: label,
            key: label,
            text: label
        }));
        const disabled = !this.state.name;

        return (
            <div>
                <Header
                    as="h2"
                    content="Edit"
                    subheader={{
                        content: "Change attributes"
                    }}
                />
                <Form>
                    <Form.Field>
                        <label>Name</label>
                        <Form.Input
                            placeholder="Name..."
                            value={this.state.name}
                            onChange={this.onNameChange}
                            error={!this.state.name}
                            disabled={this.state.loading}
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>Description</label>
                        <Form.TextArea
                            placeholder="Description..."
                            autoHeight
                            value={this.state.description}
                            onChange={this.onDescriptionChange}
                            disabled={this.state.loading}
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>Labels</label>
                        <Form.Dropdown
                            placeholder="Labels..."
                            search
                            selection
                            fluid
                            allowAdditions
                            multiple
                            value={this.state.labels}
                            options={options}
                            noResultsMessage=""
                            onChange={this.onLabelsChange}
                            renderLabel={this.labelRender}
                            disabled={this.state.loading}
                        />
                    </Form.Field>
                    <Button
                        primary
                        type="submit"
                        disabled={disabled}
                        loading={this.state.loading}
                        onClick={this.onSubmit}
                    >
                        Save changes
                    </Button>
                    <Button
                        basic
                        onClick={this.onReset}
                        disabled={this.state.loading}
                    >
                        Reset
                    </Button>
                </Form>
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
