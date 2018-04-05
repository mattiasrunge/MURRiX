
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Form } from "semantic-ui-react";

class InputTextLabels extends Component {
    onChange = (e, { value }) => {
        this.props.onChange(this.props.name, value);
    }

    labelRender = (item, index, defaultLabelProps) => ({
        content: item.text,
        color: "blue",
        size: "mini",
        ...defaultLabelProps
    })

    render() {
        const options = this.props.value.map((label) => ({
            value: label,
            key: label,
            text: label
        }));

        return (
            <Form.Field>
                <label>{this.props.label}</label>
                <Form.Dropdown
                    placeholder={this.props.placeholder}
                    value={this.props.value}
                    onChange={this.onChange}
                    error={this.props.error}
                    disabled={this.props.disabled}
                    renderLabel={this.labelRender}
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
    }
}

InputTextLabels.defaultProps = {
    value: []
};

InputTextLabels.propTypes = {
    theme: PropTypes.object,
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired
};

export default InputTextLabels;
