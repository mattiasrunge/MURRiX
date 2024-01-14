
import React from "react";
import PropTypes from "prop-types";
import { useDebounce } from "use-debounce";
import { Input, Segment } from "semantic-ui-react";
import ui from "lib/ui";
import useFocus from "hooks/useFocus";
import useNodeList from "hooks/useNodeList";
import { PageHeader } from "components/header";
import List from "./List";

const PATHS = [
    "/people",
    "/cameras",
    "/locations",
    "/albums"
];

const Search = ({ query, setQuery }) => {
    const [ ref ] = useFocus();
    const [ debQuery ] = useDebounce(query, 300);
    const options = React.useMemo(() => ({ search: debQuery }), [ debQuery ]);

    const onChange = React.useCallback((e, { value }) => setQuery(value), [ setQuery ]);

    const [ nodes, , loading ] = useNodeList(debQuery ? PATHS : null, options);

    ui.setTitle(`Search for ${query}`);

    return (
        <div>
            <PageHeader
                icon="search"
                title="Search"
                subtitle="Find content by searching for the name"
            />
            <Segment>
                <Input
                    loading={loading}
                    icon="search"
                    value={query}
                    onChange={onChange}
                    placeholder="Search..."
                    fluid
                    ref={ref}
                />
            </Segment>
            <List
                nodes={nodes}
                loading={loading}
            />
        </div>
    );
};

Search.propTypes = {
    query: PropTypes.string,
    setQuery: PropTypes.func.isRequired
};

export default Search;
