
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import Component from "lib/component";
import { api } from "lib/backend";

class InputTextLabels extends Component {
    constructor(props) {
        super(props);

        this.state = {
            labels: [],
            loading: false
        };
    }

    async load() {
        this.setState({ labels: [], loading: true });

        try {
            const labels = await api.labels();

            labels.sort((a, b) => b.count - a.count);

            !this.disposed && this.setState({
                labels: labels.map((label) => ({
                    value: label.name,
                    key: label.name,
                    text: label.name
                })),
                loading: false
            });
        } catch (error) {
            this.logError("Failed to get labels", error, 10000);
            !this.disposed && this.setState({ labels: [], loading: false });
        }
    }

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
        })).concat(this.state.labels);

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
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired
};

export default InputTextLabels;
