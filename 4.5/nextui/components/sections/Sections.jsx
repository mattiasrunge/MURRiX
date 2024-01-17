
import React from "react";
import PropTypes from "prop-types";
import { Menu } from "semantic-ui-react";
import ui from "lib/ui";
import CircularList from "lib/circular_list";
import theme from "./theme.module.css";

const Sections = ({ sections, section, setSection }) => {
    const list = React.useMemo(() => new CircularList(sections), [ sections ]);

    const onSection = React.useCallback((e, { name }) => setSection(name), [ setSection ]);

    const gotoSection = React.useCallback((offset) => {
        const section = list
        .select((section) => section.active)
        .offset(offset)
        .current;

        setSection(section.name);
    }, [ list, setSection ]);

    const onNextSection = React.useCallback(() => gotoSection(1), [ gotoSection ]);
    const onPreviousSection = React.useCallback(() => gotoSection(-1), [ gotoSection ]);

    React.useEffect(() => {
        const s1 = ui.shortcut("shift+up", onPreviousSection);
        const s2 = ui.shortcut("shift+down", onNextSection);

        return () => s1.dispose() && s2.dispose();
    }, [ onPreviousSection, onNextSection ]);

    return (
        <div className={theme.sectionsContainer}>
            <div className={theme.sectionsSidebar}>
                <Menu vertical secondary color="blue">
                    <For each="section" of={sections}>
                        <Choose>
                            <When condition={section.Component}>
                                <Menu.Item
                                    key={section.name}
                                    name={section.name}
                                    content={section.title}
                                    icon={section.icon}
                                    active={section.active}
                                    onClick={onSection}
                                />
                            </When>
                            <Otherwise>
                                <Menu.Header
                                    key={section.name}
                                    content={section.title}
                                    className={theme.sidebarHeader}
                                />
                            </Otherwise>
                        </Choose>
                    </For>
                </Menu>
            </div>
            <div className={theme.sectionsMain}>
                <If condition={section && section.Component}>
                    <section.Component
                        {...(section.props || {}) }
                    />
                </If>
            </div>
        </div>
    );
};

Sections.propTypes = {
    section: PropTypes.object,
    sections: PropTypes.array.isRequired,
    setSection: PropTypes.func.isRequired
};

export default Sections;
