
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import Component from "lib/component";

class InputBoolean extends Component {
    onChange = (e, { checked }) => {
        this.props.onChange(this.props.name, checked);
    }

    render() {
        return (
            <Form.Field>
                <label>{this.props.label}</label>
                <Form.Checkbox
                    toggle
                    checked={this.props.value}
                    onChange={this.onChange}
                    error={this.props.error}
                    disabled={this.props.disabled}
                />
            </Form.Field>
        );
    }
}

InputBoolean.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.bool,
    onChange: PropTypes.func.isRequired
};

export default InputBoolean;
