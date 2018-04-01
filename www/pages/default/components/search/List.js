
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import { Card, Loader } from "semantic-ui-react";
import { NodeCard } from "components/node";

class List extends Component {
    constructor(props) {
        super(props);

        this.state = {
            list: [],
            loading: false
        };
    }

    async load() {
        this.update(this.props.query);
    }

    componentWillReceiveProps(nextProps) {
        if (JSON.stringify(nextProps.query) !== JSON.stringify(this.props.query)) {
            this.update(nextProps.query);
        }
    }

    async update(query) {
        if (!query) {
            return this.setState({ list: [] });
        }

        try {
            this.props.onLoad && this.props.onLoad(true);
            this.setState({ list: [], loading: true });

            let list = [];

            if (query.year) {
                list = await api.murrix.albumsbyyear(query.year);
            } else {
                list = await api.vfs.list(query.paths, query.options);
            }

            !this.disposed && this.setState({ list, loading: false });
            this.props.onLoad && this.props.onLoad(false);
        } catch (error) {
            this.logError("Failed to list", error, 10000);
            !this.disposed && this.setState({ list: [], loading: false });
            this.props.onLoad && this.props.onLoad(false);
        }
    }

    render() {
        return (
            <div className={this.props.theme.searchList}>
                <Choose>
                    <When condition={this.state.list.length > 0}>
                        <Card.Group stackable itemsPerRow="4">
                            <For each="node" of={this.state.list}>
                                <NodeCard
                                    key={node._id}
                                    node={node}
                                />
                            </For>
                        </Card.Group>
                    </When>
                    <Otherwise>
                        <div className={this.props.theme.emptyList}>
                            <Choose>
                                <When condition={this.state.loading}>
                                    <Loader active>Loading...</Loader>
                                </When>
                                <Otherwise>
                                    No results
                                </Otherwise>
                            </Choose>
                        </div>
                    </Otherwise>
                </Choose>
            </div>
        );
    }
}

List.propTypes = {
    theme: PropTypes.object.isRequired,
    query: PropTypes.object,
    onLoad: PropTypes.func
};

export default List;
