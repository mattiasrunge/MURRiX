
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Form, Message } from "semantic-ui-react";
import chron from "chron-time";

class InputWhen extends Component {
    constructor(props) {
        super(props);

        this.state = this.valueToString(this.props.value);
    }

    valueToString(valueObject = null) {
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
    }

    stringToValue(value = "") {
        const valueObject = {
            ...(this.props.value || {})
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
    }

    componentDidUpdate(prevProps) {
        const state = this.valueToString(prevProps.value);

        if (!state.errorMessage && state.value !== this.state.value) {
            this.setState(state);
        }
    }

    onChange = (e, { value }) => {
        const state = this.stringToValue(value);

        this.setState({
            value,
            errorMessage: state.errorMessage
        });

        this.props.onChange(this.props.name, state.valueObject);
    }

    render() {
        return (
            <Form.Field>
                <label>{this.props.label}</label>
                <Form.Input
                    placeholder="YYYY-MM-DD HH:mm:ssZ"
                    maxLength={25}
                    value={this.state.value}
                    onChange={this.onChange}
                    error={!!this.state.errorMessage}
                    disabled={this.props.disabled}
                />
                <If condition={this.state.errorMessage}>
                    <Message
                        color="red"
                        size="mini"
                        content={this.state.errorMessage}
                    />
                </If>
            </Form.Field>
        );
    }
}

InputWhen.defaultProps = {
    value: {}
};

InputWhen.propTypes = {
    theme: PropTypes.object,
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired
};

export default InputWhen;
