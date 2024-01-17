
import React from "react";
import PropTypes from "prop-types";
import { Form, Button, Modal } from "semantic-ui-react";
import chron from "chron-time";
import useAttributeTypes from "hooks/useAttributeTypes";
import theme from "../theme.module.css";
import InputLabels from "./InputLabels";
import InputTextArea from "./InputTextArea";
import InputTextLine from "./InputTextLine";
import InputSelect from "./InputSelect";
import InputBoolean from "./InputBoolean";
import InputNumber from "./InputNumber";
import InputWhen from "./InputWhen";
import InputWhere from "./InputWhere";

const COMPONENTS = {
    textline: InputTextLine,
    text: InputTextArea,
    labels: InputLabels,
    select: InputSelect,
    boolean: InputBoolean,
    number: InputNumber,
    when: InputWhen,
    where: InputWhere
};

const validate = (field, value) => {
    if (field.required && !value) {
        return false;
    }

    if (field.type === "when") {
        try {
            chron.time2str(value);
        } catch {
            return false;
        }
    }

    return true;
};

const EditForm = ({ type, loading, attributes, setAttributes, onModalClose }) => {
    const [ types ] = useAttributeTypes(type);
    const fields = React.useMemo(() => types.map((t) => ({
        ...t,
        Component: COMPONENTS[t.type]
    })), [ types ]);
    const [ attribs, setAttribs ] = React.useState({ ...(attributes || {}) });


    const onChange = React.useCallback((name, value) => {
        setAttribs((attribs) => ({
            ...attribs,
            [name]: value
        }));
    }, []);

    const onReset = React.useCallback(() => {
        setAttribs({ ...(attributes || {}) });
    }, [ attributes ]);

    const onSave = React.useCallback(() => {
        setAttributes(attribs);
    }, [ attribs, setAttributes ]);

    const canSave = React.useMemo(() => {
        let allowed = true;

        for (const field of fields) {
            if (!validate(field, attribs[field.name])) {
                allowed = false;
                break;
            }
        }

        return allowed;
    }, [ fields, attribs ]);

    const form = (
        <Form>
            <For each="field" index="index" of={fields}>
                <field.Component
                    key={field.name}
                    theme={theme}
                    label={field.label}
                    name={field.name}
                    disabled={loading}
                    value={attribs[field.name]}
                    error={!validate(field, attribs[field.name])}
                    onChange={onChange}
                    options={field.options}
                />
            </For>
        </Form>
    );

    const buttons = (
        <>
            <If condition={attributes}>
                <Button
                    basic
                    onClick={onReset}
                    disabled={loading}
                >
                    Reset
                </Button>
            </If>
            <If condition={onModalClose}>
                <Button
                    basic
                    onClick={onModalClose}
                    disabled={loading}
                >
                    Cancel
                </Button>
            </If>
            <Button
                primary
                type="submit"
                disabled={!canSave}
                loading={loading}
                onClick={onSave}
            >
                Save changes
            </Button>
        </>
    );

    return (
        <Choose>
            <When condition={onModalClose}>
                <Modal.Content scrolling>
                    {form}
                </Modal.Content>
                <Modal.Actions>
                    {buttons}
                </Modal.Actions>
            </When>
            <Otherwise>
                {form}
                <div className={theme.formButtons}>
                    {buttons}
                </div>
            </Otherwise>
        </Choose>
    );
};

EditForm.propTypes = {
    attributes: PropTypes.object,
    type: PropTypes.string.isRequired,
    loading: PropTypes.bool,
    setAttributes: PropTypes.func.isRequired,
    onModalClose: PropTypes.func
};

export default EditForm;
