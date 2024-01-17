
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";

const InputTextArea = ({ error, disabled, label, name, placeholder, value, onChange }) => {
    const onChangeHandler = React.useCallback((e, { value }) => {
        onChange(name, value);
    }, [ name, onChange ]);

    return (
        <Form.Field>
            <label>{label}</label>
            <Form.TextArea
                placeholder={placeholder}
                value={value}
                onChange={onChangeHandler}
                error={error}
                disabled={disabled}
            />
        </Form.Field>
    );
};

InputTextArea.defaultProps = {
    value: ""
};

InputTextArea.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

export default InputTextArea;
