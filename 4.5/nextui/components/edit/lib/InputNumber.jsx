
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";

const InputNumber = ({ error, disabled, label, name, placeholder, value, onChange }) => {
    const onChangeHandler = React.useCallback((e, { value }) => {
        onChange(name, Number.parseInt(value, 10));
    }, [ name, onChange ]);

    return (
        <Form.Field>
            <label>{label}</label>
            <Form.Input
                type="number"
                placeholder={placeholder}
                value={value}
                onChange={onChangeHandler}
                error={error}
                disabled={disabled}
            />
        </Form.Field>
    );
};

InputNumber.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.number,
    onChange: PropTypes.func.isRequired
};

export default InputNumber;
