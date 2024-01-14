
import React from "react";
import PropTypes from "prop-types";
import { Card, Loader } from "semantic-ui-react";
import { NodeCard } from "components/nodeparts";
import theme from "./theme.module.css";

const SearchList = ({ nodes, loading }) => (
    <div className={theme.searchList}>
        <Choose>
            <When condition={nodes.length > 0}>
                <Card.Group stackable itemsPerRow="4">
                    <For each="node" of={nodes}>
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
                        <When condition={loading}>
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

SearchList.propTypes = {
    nodes: PropTypes.array.isRequired,
    loading: PropTypes.bool
};

export default SearchList;
