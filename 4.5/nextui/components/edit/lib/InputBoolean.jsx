
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";

const InputBoolean = ({ error, disabled, label, name, value, onChange }) => {
    const onChangeHandler = React.useCallback((e, { checked }) => {
        onChange(name, checked);
    }, [ name, onChange ]);

    return (
        <Form.Field>
            <label>{label}</label>
            <Form.Checkbox
                toggle
                checked={value}
                onChange={onChangeHandler}
                error={error}
                disabled={disabled}
            />
        </Form.Field>
    );
};

InputBoolean.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.bool,
    onChange: PropTypes.func.isRequired
};

export default InputBoolean;
