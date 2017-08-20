
import React from "react";
import Component from "lib/component";
import PropTypes from "prop-types";
import chron from "chron-time";

class NodeWidgetTimeInput extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: chron.time2str(props.value || {})
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ value: chron.time2str(nextProps.value || {}) });
    }

    onBlur(event) {
        const current = chron.time2str(this.props.value || {});

        if (current !== event.target.value) {
            this.props.onChange(chron.str2time(event.target.value));
        }
    }

    onChange(event) {
        try {
            chron.str2time(event.target.value);
            this.setState({ error: false, value: event.target.value });
        } catch (e) {
            this.setState({ error: e.message, value: event.target.value });
        }
    }

    render() {
        return (
            <span className="widget-time-input">
                <input
                    type="text"
                    value={this.state.value}
                    className={`form-control ${this.state.error ? "has-error" : ""}`}
                    disabled={this.props.disabled}
                    placeholder="YYYY-MM-DD HH:mm:ssZ"
                    maxLength={25}
                    onChange={(e) => this.onChange(e)}
                    onBlur={(e) => this.onBlur(e)}
                />
                <If condition={this.state.error}>
                    <span className="text-danger">{this.state.error}</span>
                </If>
            </span>
        );
    }
}

NodeWidgetTimeInput.defaultProps = {
    disabled: false
};

NodeWidgetTimeInput.propTypes = {
    disabled: PropTypes.bool,
    value: PropTypes.any.isRequired,
    onChange: PropTypes.func.isRequired
};

export default NodeWidgetTimeInput;
