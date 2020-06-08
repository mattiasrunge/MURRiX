
import React from "react";
import PropTypes from "prop-types";
import { Header, Grid, Table, Label, Checkbox } from "semantic-ui-react";
import Component from "lib/component";
import { api } from "lib/backend";
import notification from "lib/notification";
import InputLabels from "components/edit/lib/InputLabels"; // TODO: Break out? should not import something from lib in another component
import theme from "../../theme.module.css";

class Labels extends Component {
    constructor(props) {
        super(props);

        this.state = {
            labels: [],
            loading: false,
            saving: false
        };
    }

    async load() {
        this.setState({ loading: true });

        try {
            const labels = await api.labels(this.props.node.path);

            this.setState({
                labels: labels.map(({ name }) => name),
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load labels", error);
            notification.add("error", error.message, 10000);
            this.setState({ labels: [], loading: false });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.node !== this.props.node) {
            this.load();
        }
    }

    onChange = async (name, labels) => {
        const changed = [
            ...labels.filter((name) => !this.state.labels.includes(name)),
            ...this.state.labels.filter((name) => !labels.includes(name))
        ];

        for (const label of changed) {
            try {
                await api.label(label, this.props.node.path);
            } catch (error) {
                this.logError("Failed to save labels", error);
                notification.add("error", error.message, 10000);
            }
        }

        this.setState({ labels });

        await this.load();
    }

    render() {
        return (
            <div>
                <Header as="h2">
                    Labels
                    <Header.Subheader>
                        Add and remove labels
                    </Header.Subheader>
                </Header>
                <InputLabels
                    label=""
                    name="labels"
                    value={this.state.labels}
                    onChange={this.onChange}
                />
            </div>
        );
    }
}

Labels.propTypes = {
    node: PropTypes.object.isRequired
};

export default Labels;
