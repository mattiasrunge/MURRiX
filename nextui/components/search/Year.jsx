
import React from "react";
import PropTypes from "prop-types";
import { useDebounce } from "use-debounce";
import { Segment, Button } from "semantic-ui-react";
import { Slider } from "react-semantic-ui-range";
// import { Calendar, CalendarControls } from "react-yearly-calendar";
import ui from "lib/ui";
import useAlbumsByYear from "hooks/useAlbumsByYear";
import { PageHeader } from "components/header";
import List from "./List";
import theme from "./theme.module.css";

const SearchYear = ({ year, setYear }) => {
    const [ debYear ] = useDebounce(year, 300);
    const [ nodes, , loading ] = useAlbumsByYear(debYear);

    const settings = React.useMemo(() => ({
        min: 1600,
        max: new Date().getFullYear(),
        step: 1,
        start: year,
        onChange: setYear
    }), [ year, setYear ]);

    const onIncrease = React.useCallback(() => setYear(Math.min(settings.max, settings.start + 1)), [ settings, setYear ]);
    const onDecrease = React.useCallback(() => setYear(Math.max(settings.min, settings.start - 1)), [ settings, setYear ]);
    // const onPickData = React.useCallback((date) => console.log(date), []);

    ui.setTitle(`Browsing year ${year}`);

    return (
        <div>
            <PageHeader
                icon="calendar alternate outline"
                title="Browse albums by year"
                subtitle="Find content by year"
                extra={(
                    <span className={theme.headerInfo}>
                        {year}
                    </span>
                )}
            />
            <Segment>
                <div className={theme.yearSliderTable}>
                    <Button
                        className={theme.yearSliderButton}
                        icon="minus"
                        circular
                        basic
                        size="tiny"
                        disabled={year === settings.min}
                        onClick={onDecrease}
                    />
                    <div className={theme.yearSliderInput}>
                        <Slider
                            color="invalidInputTrackFill"
                            settings={settings}
                        />
                    </div>
                    <Button
                        className={theme.yearSliderButton}
                        icon="add"
                        circular
                        basic
                        size="tiny"
                        disabled={year === settings.max}
                        onClick={onIncrease}
                    />
                </div>
                {/* <div>
                    <Calendar
                        year={year}
                        // selectRange
                        firstDayOfWeek={1}
                        onPickRange={onPickData}
                    />
                </div> */}
            </Segment>
            <List
                nodes={nodes}
                loading={loading}
            />
        </div>
    );
};

SearchYear.propTypes = {
    year: PropTypes.string,
    setYear: PropTypes.func.isRequired
};

export default SearchYear;
