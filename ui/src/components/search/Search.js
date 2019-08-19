
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Input, Segment } from "semantic-ui-react";
import { Header } from "components/home";
import Component from "lib/component";
import { Focus } from "components/utils";
import List from "./List";
import ui from "lib/ui";
import theme from "./theme.module.css";

class Search extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            query: this.props.match.params.query || ""
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.match.params.query !== this.props.match.params.query) {
            this.setState({ query: this.props.match.params.query || "" });
        }
    }

    delayQuery(query) {
        this.timer && clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.state.loading) {
                this.delayQuery(query);
            } else {
                const url = this.props.match.path.split(":")[0];

                this.props.history.replace(`${url}${query}`);
            }
        }, 500);
    }

    onChange = (e, { value }) => {
        this.setState({ query: value });
        this.delayQuery(value);
    }

    onLoad = (loading) => {
        this.setState({ loading });
    }

    render() {
        const query = this.props.match.params.query ? {
            options: {
                search: this.props.match.params.query
            },
            paths: [
                "/people",
                "/cameras",
                "/locations",
                "/albums"
            ]
        } : null;

        ui.setTitle("Searching");

        return (
            <div>
                <Header
                    icon="search"
                    title="Search"
                    subtitle="Find content by searching for the name"
                />
                <Segment>
                    <Focus select>
                        <Input
                            loading={this.state.loading}
                            icon="search"
                            value={this.state.query}
                            onChange={this.onChange}
                            placeholder="Search..."
                            fluid
                        />
                    </Focus>
                </Segment>
                <List
                    theme={theme}
                    query={query}
                    onLoad={this.onLoad}
                />
            </div>
        );
    }
}

Search.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(Search);
