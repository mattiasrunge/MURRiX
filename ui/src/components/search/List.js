
import React from "react";
import PropTypes from "prop-types";
import { Card, Loader } from "semantic-ui-react";
import Component from "lib/component";
import { cmd } from "lib/backend";
import { NodeCard } from "components/nodeparts";
import theme from "./theme.module.css";

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

    componentDidUpdate(prevProps) {
        if (JSON.stringify(prevProps.query) !== JSON.stringify(this.props.query)) {
            this.update(this.props.query);
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
                list = await cmd.albumsbyyear(query.year);

                list.sort((a, b) => b.extra.age.birthdate.localeCompare(a.extra.age.birthdate));
            } else {
                list = await cmd.list(query.paths, query.options);
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
            <div className={theme.searchList}>
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
                        <div className={theme.emptyList}>
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
    query: PropTypes.object,
    onLoad: PropTypes.func
};

export default List;
