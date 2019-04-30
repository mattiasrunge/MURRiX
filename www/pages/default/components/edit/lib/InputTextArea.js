
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Form } from "semantic-ui-react";

class InputTextArea extends Component {
    onChange = (e, { value }) => {
        this.props.onChange(this.props.name, value);
    }

    render() {
        return (
            <Form.Field>
                <label>{this.props.label}</label>
                <Form.TextArea
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

InputTextArea.defaultProps = {
    value: ""
};

InputTextArea.propTypes = {
    theme: PropTypes.object,
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

export default InputTextArea;
