
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import useLabels from "hooks/useLabels";

const labelRender = (item, index, defaultLabelProps) => ({
    content: item.text,
    color: "blue",
    size: "mini",
    ...defaultLabelProps
});

const InputTextLabels = ({ error, disabled, label, name, placeholder, value, onChange }) => {
    const [ labels ] = useLabels();
    const options = React.useMemo(() => ({
        ...value.map((name) => ({
            value: name,
            key: name,
            text: name
        })),
        ...labels.map((label) => ({
            value: label.name,
            key: label.name,
            text: label.name
        }))
    }), [ labels, value ]);

    const onChangeHandler = React.useCallback((e, { value }) => {
        onChange(name, value);
    }, [ name, onChange ]);

    return (
        <Form.Field>
            <label>{label}</label>
            <Form.Dropdown
                placeholder={placeholder}
                value={value}
                onChange={onChangeHandler}
                error={error}
                disabled={disabled}
                renderLabel={labelRender}
                options={options}
                noResultsMessage=""
                search
                selection
                fluid
                allowAdditions
                multiple
            />
        </Form.Field>
    );
};

InputTextLabels.defaultProps = {
    value: []
};

InputTextLabels.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired
};

export default InputTextLabels;
