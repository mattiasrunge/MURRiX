
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import { Card, Message } from "semantic-ui-react";
import { NodeCard } from "components/node";

class List extends Component {
    constructor(props) {
        super(props);

        this.state = {
            list: []
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
        if (!query.search) {
            return this.setState({ list: [] });
        }

        try {
            this.props.onLoad(true);

            const p = query.paths.map((path) => api.vfs.list(path, {
                search: query.search
            }));

            const results = await Promise.all(p);
            const list = [];

            for (const result of results) {
                list.push(...result);
            }

            this.setState({ list });
            this.props.onLoad(false);
        } catch (error) {
            this.logError("Failed to list", error, 10000);
            this.setState({ list: [] });
            this.props.onLoad(false);
        }
    }

    render() {
        return (
            <div className={this.props.theme.searchList}>
                <Choose>
                    <When condition={this.state.list.length > 0}>
                        <Card.Group stackable>
                            <For each="node" of={this.state.list}>
                                <NodeCard
                                    key={node._id}
                                    node={node}
                                />
                            </For>
                        </Card.Group>
                    </When>
                    <When condition={this.props.query}>
                        <div className={this.props.theme.emptyList}>
                            No results
                        </div>
                    </When>
                </Choose>
            </div>
        );
    }
}

List.propTypes = {
    theme: PropTypes.object.isRequired,
    query: PropTypes.object.isRequired,
    onLoad: PropTypes.func.isRequired
};

export default List;
