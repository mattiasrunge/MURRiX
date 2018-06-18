
import React, { Fragment } from "react";
import PropTypes from "prop-types";
import api from "api.io-client";
import notification from "lib/notification";
import Component from "lib/component";
import { Form, Button, Modal } from "semantic-ui-react";
import { Focus } from "components/utils";
import InputLabels from "./InputLabels";
import InputTextArea from "./InputTextArea";
import InputTextLine from "./InputTextLine";
import InputSelect from "./InputSelect";
import InputBoolean from "./InputBoolean";
import InputNumber from "./InputNumber";
import InputWhen from "./InputWhen";
import chron from "chron-time";

const Components = {
    textline: InputTextLine,
    text: InputTextArea,
    labels: InputLabels,
    select: InputSelect,
    boolean: InputBoolean,
    number: InputNumber,
    when: InputWhen
};

class EditForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...(props.attributes || {}),
            __fields: []
        };
    }

    async load() {
        await this.getAttributeTypes();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.type !== this.props.type) {
            this.getAttributeTypes();
        }
    }

    async getAttributeTypes() {
        try {
            const types = await api.vfs.attribtypes(this.props.type);
            const fields = types.map((atype) => ({
                ...atype,
                Component: Components[atype.type]
            }));

            !this.disposed && this.setState({ __fields: fields });
        } catch (error) {
            this.logError("Failed to get attribute types", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ __fields: [] });
        }
    }

    onChange = (name, value) => {
        this.setState({ [name]: value });
    }

    onReset = () => {
        this.setState({ ...(this.props.attributes || {}) });
    }

    onSave = () => {
        const attributes = { ...this.state };

        for (const key of Object.keys(this.state)) {
            if (key.startsWith("__")) {
                delete attributes[key];
            }
        }

        this.props.onSave(attributes);
    }

    validate(field, value) {
        if (field.required && !value) {
            return false;
        }

        if (field.type === "when") {
            try {
                chron.time2str(value);
            } catch (e) {
                return false;
            }
        }

        return true;
    }

    canSave() {
        let allowed = true;

        for (const field of this.state.__fields) {
            if (!this.validate(field, this.state[field.name])) {
                allowed = false;
                break;
            }
        }

        return allowed;
    }

    render() {
        const form = (
            <Form>
                <For each="field" index="index" of={this.state.__fields}>
                    <Focus
                        key={field.name}
                        focus={index === 0}
                    >
                        <// eslint-disable-next-line
                         field.Component
                            theme={this.props.theme}
                            label={field.label}
                            name={field.name}
                            disabled={this.props.saving}
                            value={this.state[field.name]}
                            error={!this.validate(field, this.state[field.name])}
                            onChange={this.onChange}
                            options={field.options}
                        />
                    </Focus>
                </For>
            </Form>
        );

        const buttons = (
            <Fragment>
                <If condition={this.props.attributes}>
                    <Button
                        basic
                        onClick={this.onReset}
                        disabled={this.props.saving}
                    >
                        Reset
                    </Button>
                </If>
                <If condition={this.props.onModalClose}>
                    <Button
                        basic
                        onClick={this.props.onModalClose}
                        disabled={this.props.saving}
                    >
                        Cancel
                    </Button>
                </If>
                <Button
                    primary
                    type="submit"
                    disabled={!this.canSave()}
                    loading={this.props.saving}
                    onClick={this.onSave}
                >
                    Save changes
                </Button>
            </Fragment>
        );

        if (this.props.onModalClose) {
            return (
                <Fragment>
                    <Modal.Content scrolling>
                        {form}
                    </Modal.Content>
                    <Modal.Actions>
                        {buttons}
                    </Modal.Actions>
                </Fragment>
            );
        }

        return (
            <Fragment>
                {form}
                <div style={{ marginTop: "1em" }}>
                    {buttons}
                </div>
            </Fragment>
        );
    }
}

EditForm.propTypes = {
    theme: PropTypes.object,
    attributes: PropTypes.object,
    type: PropTypes.string.isRequired,
    saving: PropTypes.bool,
    onSave: PropTypes.func.isRequired,
    onModalClose: PropTypes.func
};

export default EditForm;
