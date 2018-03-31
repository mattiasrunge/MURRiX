
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import { Header, Segment, Label, Loader } from "semantic-ui-react";
import List from "./List";
import ui from "lib/ui";

class SearchLabel extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            label: this.props.match.params.label,
            labels: []
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.match.params.label !== this.props.match.params.label) {
            this.setState({ label: nextProps.match.params.label });
        }
    }

    async load() {
        const labels = await api.vfs.labels();

        this.setState({
            labels: labels.map((label) => ({
                ...label,
                onClick: this.onChange.bind(this, label.name)
            }))
        });
    }

    onChange(label) {
        const url = this.props.match.path.split(":")[0];

        this.context.router.history.replace(`${url}${label}`);
    }

    onLoad = (loading) => {
        this.setState({ loading });
    }

    render() {
        const currentLabel = this.props.match.params.label || false;
        const query = currentLabel ? {
            options: {
                query: {
                    "attributes.labels": currentLabel
                }
            },
            paths: [
                "/people",
                "/cameras",
                "/locations",
                "/albums"
            ]
        } : null;

        ui.setTitle(`Browsing label ${currentLabel || ""}`);

        return (
            <div>
                <Header>Browse by label</Header>
                <Segment textAlign="center">
                    <Loader active={this.state.loading}>Loading...</Loader>
                    <For each="label" of={this.state.labels}>
                        <Label
                            key={label.name}
                            className={this.props.theme.labelButton}
                            content={label.name}
                            detail={label.count}
                            color={label.name === currentLabel ? "blue" : null}
                            size="small"
                            image
                            onClick={label.onClick}
                        />
                    </For>
                </Segment>
                <List
                    theme={this.props.theme}
                    query={query}
                />
            </div>
        );
    }
}

SearchLabel.propTypes = {
    theme: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

SearchLabel.contextTypes = {
    router: PropTypes.object.isRequired
};

export default SearchLabel;
