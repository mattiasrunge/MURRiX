
import React from "react";
import PropTypes from "prop-types";
import { Segment, Button } from "semantic-ui-react";
import ui from "lib/ui";
import useNodeList from "hooks/useNodeList";
import { PageHeader } from "components/header";
import List from "./List";
import theme from "./theme.module.css";

const PATHS = [
    "/people",
    "/cameras",
    "/locations",
    "/albums"
];

const LETTERS = [
    ...Array.from({ length: 26 }, (item, i) => String.fromCharCode(65 + i)),
    String.fromCharCode(197), // Å
    String.fromCharCode(196), // Ä
    String.fromCharCode(214) // Ö
];

const SearchName = ({ letter, setLetter }) => {
    const options = React.useMemo(() => ({ pattern: `${letter}.*` }), [ letter ]);

    const [ nodes, , loading ] = useNodeList(letter ? PATHS : null, options);

    ui.setTitle(`Browsing names starting with ${letter}`);

    return (
        <div>
            <PageHeader
                icon="keyboard outline"
                title="Browse by name"
                subtitle="Find content by first letter in name"
            />
            <Segment>
                <div className={theme.nameLetterContainer}>
                    <For each="l" of={LETTERS}>
                        <Button
                            key={l}
                            className={theme.nameLetterButton}
                            content={l}
                            basic={l !== letter}
                            color={l === letter ? "blue" : null}
                            size="mini"
                            active={l === letter}
                            onClick={() => setLetter(l)}
                        />
                    </For>
                </div>
            </Segment>
            <List
                nodes={nodes}
                loading={loading}
            />
        </div>
    );
};

SearchName.propTypes = {
    letter: PropTypes.string,
    setLetter: PropTypes.func.isRequired
};

export default SearchName;
