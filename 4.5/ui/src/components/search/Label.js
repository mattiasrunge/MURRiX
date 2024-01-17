
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Segment, Label, Loader } from "semantic-ui-react";
import { Header } from "components/header";
import Component from "lib/component";
import { api } from "lib/backend";
import ui from "lib/ui";
import List from "./List";
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
        const label = this.props.match.params.label || false;
        const query = label ? {
            label
        } : null;

        ui.setTitle(`Browsing label ${label || ""}`);

        return (
            <div>
                <Header
                    icon="tags"
                    title="Browse by label"
                    subtitle="Find content with specific label"
                />
                <Segment textAlign="center">
                    <Loader active={this.state.loading}>Loading...</Loader>
                    <For each="item" of={this.state.labels}>
                        <Link
                            key={item.name}
                            to={`${this.props.match.path.split(":")[0]}${item.name}`}
                        >
                            <Label
                                className={theme.labelButton}
                                content={item.name}
                                detail={item.count}
                                color={item.name === label ? "blue" : null}
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
