
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Header, Input } from "semantic-ui-react";
import { Focus } from "components/utils";
import List from "./List";

class Search extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            query: this.props.match.params.query || ""
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.match.params.query !== this.props.match.params.query) {
            this.setState({ query: nextProps.match.params.query || "" });
        }
    }

    onChange(query) {
        this.setState({ query });
        this.delayQuery(query);
    }

    delayQuery(query) {
        this.timer && clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.state.loading) {
                this.delayQuery(query);
            } else {
                const url = this.props.match.path.split(":")[0];

                this.context.router.history.replace(`${url}${query}`);
            }
        }, 500);
    }

    render() {
        return (
            <div>
                <Header>Search</Header>
                <Focus>
                    <Input
                        loading={this.state.loading}
                        icon="search"
                        value={this.state.query}
                        onChange={(e, { value }) => this.onChange(value)}
                        placeholder="Search..."
                        fluid
                    />
                </Focus>
                <List
                    theme={this.props.theme}
                    query={{
                        search: this.props.match.params.query,
                        paths: [
                            "/people",
                            "/cameras",
                            "/locations",
                            "/albums"
                        ]
                    }}
                    onLoad={(loading) => this.setState({ loading })}
                />
            </div>
        );
    }
}

Search.propTypes = {
    theme: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

Search.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Search;
