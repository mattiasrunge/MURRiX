
import React from "react";
import PropTypes from "prop-types";
import { Segment, Label, Loader } from "semantic-ui-react";
import ui from "lib/ui";
import useNodeList from "hooks/useNodeList";
import useLabels from "hooks/useLabels";
import { PageHeader } from "components/header";
import List from "./List";
import theme from "./theme.module.css";

const SearchLabel = ({ label, setLabel }) => {
    const [ labels, , labelsLoading ] = useLabels();
    const path = React.useMemo(() => label ? `/labels/${label}` : null, [ label ]);
    const [ nodes, , nodeLoading ] = useNodeList(path);

    ui.setTitle(label ? `Browsing label ${label}` : "Browsing labels");

    return (
        <div>
            <PageHeader
                icon="tags"
                title="Browse by label"
                subtitle="Find content with specific label"
            />
            <Segment textAlign="center">
                <Loader active={labelsLoading}>Loading...</Loader>
                <For each="item" of={labels}>
                    <Label
                        key={item.name}
                        className={theme.labelButton}
                        content={item.name}
                        detail={item.count}
                        color={item.name === label ? "blue" : null}
                        size="small"
                        image
                        onClick={() => setLabel(item.name)}
                    />
                </For>
            </Segment>
            <List
                nodes={nodes}
                loading={nodeLoading}
            />
        </div>
    );
};

SearchLabel.propTypes = {
    label: PropTypes.string,
    setLabel: PropTypes.func.isRequired
};

export default SearchLabel;
