
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Segment, Label, Loader } from "semantic-ui-react";
import { Header } from "components/home";
import Component from "lib/component";
import { api } from "lib/backend";
import List from "./List";
import ui from "lib/ui";
import theme from "./theme.module.css";

class SearchLabel extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            label: this.props.match.params.label,
            labels: []
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.match.params.label !== this.props.match.params.label) {
            this.setState({ label: this.props.match.params.label });
        }
    }

    async load() {
        const labels = await api.labels();

        labels.sort((a, b) => a.name.localeCompare(b.name));

        this.setState({ labels });
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
                <Header
                    icon="tags"
                    title="Browse by label"
                    subtitle="Find content with specific label"
                />
                <Segment textAlign="center">
                    <Loader active={this.state.loading}>Loading...</Loader>
                    <For each="label" of={this.state.labels}>
                        <Link
                            key={label.name}
                            to={`${this.props.match.path.split(":")[0]}${label.name}`}
                        >
                            <Label
                                className={theme.labelButton}
                                content={label.name}
                                detail={label.count}
                                color={label.name === currentLabel ? "blue" : null}
                                size="small"
                                image
                            />
                        </Link>
                    </For>
                </Segment>
                <List
                    theme={theme}
                    query={query}
                />
            </div>
        );
    }
}

SearchLabel.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

export default SearchLabel;
