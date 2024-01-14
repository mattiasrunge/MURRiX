
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";

const InputTextLine = ({ error, disabled, label, name, placeholder, value, onChange }) => {
    const onChangeHandler = React.useCallback((e, { value }) => {
        onChange(name, value);
    }, [ name, onChange ]);

    return (
        <Form.Field>
            <label>{label}</label>
            <Form.Input
                placeholder={placeholder}
                value={value}
                onChange={onChangeHandler}
                error={error}
                disabled={disabled}
            />
        </Form.Field>
    );
};

InputTextLine.defaultProps = {
    value: ""
};

InputTextLine.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

export default InputTextLine;
