
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Segment, Button } from "semantic-ui-react";
import { Header } from "components/home";
import { Slider } from "react-semantic-ui-range";
import Component from "lib/component";
import List from "./List";
import ui from "lib/ui";
import theme from "./theme.module.css";

class Year extends Component {
    constructor(props) {
        super(props);

        const thisYear = new Date().getFullYear();

        this.years = [];

        for (let year = 1600; year <= thisYear; year++) {
            this.years.push(year);
        }

        this.state = {
            loading: false,
            query: {
                year: this.getYear(props)
            }
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.match.params.year !== this.props.match.params.year) {
            const query = {
                year: this.getYear(this.props)
            };

            this.setState({ query });
        }
    }

    getYear(props) {
        return parseInt(props.match.params.year || this.years[this.years.length - 1], 10);
    }

    setYear(year) {
        this.timer && clearTimeout(this.timer);
        this.timer = null;

        const url = this.props.match.path.split(":")[0];

        this.props.history.replace(`${url}${year}`);
    }

    delayQuery(year) {
        this.timer && clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.state.loading) {
                this.delayQuery(year);
            } else {
                this.setYear(year);
            }
        }, 100);
    }

    onChange = (year) => {
        // this.setState({ year });
        this.delayQuery(year);
    }

    onLoad = (loading) => {
        this.setState({ loading });
    }

    onIncrease = () => {
        const year = this.getYear(this.props) + 1;
        // this.setState({ year });
        this.delayQuery(year);
    }

    onDecrease = () => {
        const year = this.getYear(this.props) - 1;
        // this.setState({ year });
        this.delayQuery(year);
    }

    render() {
        const currentYear = this.getYear(this.props);
        const query = this.state.query;
        const settings = {
            min: this.years[0],
            max: this.years[this.years.length - 1],
            step: 1,
            start: currentYear,
            onChange: this.onChange
        };

        ui.setTitle(`Browsing year ${currentYear}`);

        return (
            <div>
                <Header
                    icon="calendar alternate outline"
                    title="Browse albums by year"
                    subtitle="Find content by year"
                    extra={(
                        <span className={theme.headerInfo}>
                            {currentYear}
                        </span>
                    )}
                />

                <Segment className={theme.yearSliderTable}>
                    <Button
                        className={theme.yearSliderButton}
                        icon="minus"
                        circular
                        basic
                        size="tiny"
                        disabled={currentYear === settings.min}
                        onClick={this.onDecrease}
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
                        disabled={currentYear === settings.max}
                        onClick={this.onIncrease}
                    />
                </Segment>
                <List
                    theme={theme}
                    query={query}
                    onLoad={this.onLoad}
                />
            </div>
        );
    }
}

Year.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(Year);
