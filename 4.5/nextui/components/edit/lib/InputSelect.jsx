
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";

const InputSelect = ({ error, disabled, label, name, placeholder, value, onChange, options }) => {
    const onChangeHandler = React.useCallback((e, { value }) => {
        onChange(name, value);
    }, [ name, onChange ]);

    const opts = React.useMemo(() => Object.keys(options).map((value) => ({
        text: options[value],
        value
    })), [ options ]);

    return (
        <Form.Field>
            <label>{label}</label>
            <Form.Select
                placeholder={placeholder}
                value={value}
                onChange={onChangeHandler}
                error={error}
                disabled={disabled}
                options={opts}
            />
        </Form.Field>
    );
};

InputSelect.defaultProps = {
    value: ""
};

InputSelect.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
};

export default InputSelect;
