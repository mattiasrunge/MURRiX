
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Form } from "semantic-ui-react";

class InputSelect extends Component {
    onChange = (e, { value }) => {
        this.props.onChange(this.props.name, value);
    }

    render() {
        const options = Object.keys(this.props.options).map((value) => ({
            text: this.props.options[value],
            value
        }));

        return (
            <Form.Field>
                <label>{this.props.label}</label>
                <Form.Select
                    placeholder={this.props.placeholder}
                    value={this.props.value}
                    onChange={this.onChange}
                    error={this.props.error}
                    disabled={this.props.disabled}
                    options={options}
                />
            </Form.Field>
        );
    }
}

InputSelect.defaultProps = {
    value: ""
};

InputSelect.propTypes = {
    theme: PropTypes.object,
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
