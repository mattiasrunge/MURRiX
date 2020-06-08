
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Label } from "semantic-ui-react";
import Component from "lib/component";
import { api } from "lib/backend";
import theme from "./theme.module.css";

class NodeLabels extends Component {
    constructor(props) {
        super(props);

        this.state = {
            labels: [],
            loading: false
        };
    }

    async load() {
        await this.update(this.props);
    }

    componentDidUpdate(prevProps) {
        if (this.props.node !== prevProps.node) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ labels: [], loading: true });

        try {
            const labels = await api.labels(props.node.path);

            labels.sort((a, b) => b.count - a.count);

            !this.disposed && this.setState({ labels, loading: false });
        } catch (error) {
            this.logError("Failed to get node labels", error, 10000);
            !this.disposed && this.setState({ labels: [], loading: false });
        }
    }

    onClick = (e, label) => {
        this.props.history.push(`/home/label/${label.content}`);
    }

    render() {
        return (
            <div
                className={this.props.className}
            >
                <For each="label" of={this.state.labels}>
                    <Label
                        key={label.name}
                        className={this.props.labelClassName}
                        content={label.name}
                        detail={this.props.detailed ? label.count : null}
                        color="blue"
                        size={this.props.size}
                        image={this.detailed}
                        onClick={theme.nodeCardLabel ? this.onClick : null}
                    />
                </For>
            </div>
        );
    }
}

NodeLabels.defaultProps = {
    size: "small",
    detailed: true,
    labelClassName: theme.labelButton
};

NodeLabels.propTypes = {
    className: PropTypes.string,
    node: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    clickable: PropTypes.bool,
    detailed: PropTypes.bool,
    size: PropTypes.string,
    labelClassName: PropTypes.string
};

export default withRouter(NodeLabels);
