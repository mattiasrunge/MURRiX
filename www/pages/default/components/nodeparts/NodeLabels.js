
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import { Label } from "semantic-ui-react";

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

    componentWillReceiveProps(nextProps) {
        if (this.props.node !== nextProps.node) {
            this.update(nextProps);
        }
    }

    async update(props) {
        this.setState({ labels: [], loading: true });

        try {
            const labels = await api.vfs.labels(props.node.path);

            labels.sort((a, b) => b.count - a.count);

            !this.disposed && this.setState({
                labels: labels.map((label) => ({
                    ...label,
                    onClick: this.onChange.bind(this, label.name)
                })),
                loading: false
            });
        } catch (error) {
            this.logError("Failed to get node labels", error, 10000);
            !this.disposed && this.setState({ labels: [], loading: false });
        }
    }

    onChange(label) {
        this.context.router.history.push(`/home/label/${label}`);
    }

    render() {
        return (
            <div
                className={this.props.className}
            >
                <For each="label" of={this.state.labels}>
                    <Label
                        key={label.name}
                        className={this.props.theme.labelButton}
                        content={label.name}
                        detail={label.count}
                        color="blue"
                        size="small"
                        image
                        onClick={label.onClick}
                    />
                </For>
            </div>
        );
    }
}

NodeLabels.propTypes = {
    theme: PropTypes.object,
    className: PropTypes.string,
    node: PropTypes.object.isRequired
};

NodeLabels.contextTypes = {
    router: PropTypes.object.isRequired
};

export default NodeLabels;
