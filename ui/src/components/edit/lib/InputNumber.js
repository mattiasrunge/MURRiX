
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import Component from "lib/component";

class InputNumber extends Component {
    onChange = (e, { value }) => {
        this.props.onChange(this.props.name, parseInt(value, 10));
    }

    render() {
        return (
            <Form.Field>
                <label>{this.props.label}</label>
                <Form.Input
                    type="number"
                    placeholder={this.props.placeholder}
                    value={this.props.value}
                    onChange={this.onChange}
                    error={this.props.error}
                    disabled={this.props.disabled}
                />
            </Form.Field>
        );
    }
}


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
