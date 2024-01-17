
import React from "react";
import PropTypes from "prop-types";
import { Form, Message } from "semantic-ui-react";
import chron from "chron-time";
import useOnChange from "hooks/useOnChange";

const valueToString = (valueObject = null) => {
    let value = "";
    let errorMessage = "";

    try {
        value = chron.time2str(valueObject ? (valueObject.manual || {}) : {});
    } catch (error) {
        errorMessage = error.message;
    }

    return {
        value,
        errorMessage
    };
};

const stringToValue = (currentValue, value = "") => {
    const valueObject = {
        ...(currentValue || {})
    };
    let errorMessage = "";

    try {
        valueObject.manual = chron.str2time(value) || null;
    } catch (error) {
        errorMessage = error.message;
        valueObject.manual = null;
    }

    return {
        valueObject,
        errorMessage
    };
};

const InputWhen = ({ disabled, label, name, value, onChange }) => {
    const [ currentValue, setCurrentValue ] = React.useState(valueToString(value));

    useOnChange(value, React.useCallback((prev, value) => setCurrentValue(valueToString(value)), []));

    const onChangeHandler = React.useCallback((e, { value }) => {
        const newValue = stringToValue(currentValue.value, value);

        setCurrentValue(newValue);

        onChange(name, newValue.valueObject);
    }, [ name, onChange, currentValue ]);

    return (
        <Form.Field>
            <label>{label}</label>
            <Form.Input
                placeholder="YYYY-MM-DD HH:mm:ssZ"
                maxLength={25}
                value={currentValue.value}
                onChange={onChangeHandler}
                error={!!currentValue.errorMessage}
                disabled={disabled}
            />
            <If condition={currentValue.errorMessage}>
                <Message
                    color="red"
                    size="mini"
                    content={currentValue.errorMessage}
                />
            </If>
        </Form.Field>
    );
};

InputWhen.defaultProps = {
    value: {}
};

InputWhen.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired
};

export default InputWhen;
