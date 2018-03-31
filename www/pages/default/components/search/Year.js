
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Header, Segment, Button } from "semantic-ui-react";
import { Slider } from "react-semantic-ui-range";
import List from "./List";
import ui from "lib/ui";

class Year extends Component {
    constructor(props) {
        super(props);

        const thisYear = new Date().getFullYear();

        this.state = {
            loading: false,
            year: this.props.match.params.year ? parseInt(this.props.match.params.year, 10) : thisYear
        };

        this.years = [];

        for (let year = 1600; year <= thisYear; year++) {
            this.years.push(year);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.match.params.year !== this.props.match.params.year) {
            const thisYear = new Date().getFullYear();
            const year = nextProps.match.params.year ? parseInt(nextProps.match.params.year, 10) : thisYear;

            this.setState({ year });
        }
    }

    delayQuery(year) {
        this.timer && clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.state.loading) {
                this.delayQuery(year);
            } else {
                const url = this.props.match.path.split(":")[0];

                this.context.router.history.replace(`${url}${year}`);
            }
        }, 500);
    }

    onChange = (year) => {
        this.setState({ year });
        this.delayQuery(year);
    }

    onLoad = (loading) => {
        this.setState({ loading });
    }

    onIncrease = () => {
        const year = this.state.year + 1;
        this.setState({ year });
        this.delayQuery(year);
    }

    onDecrease = () => {
        const year = this.state.year - 1;
        this.setState({ year });
        this.delayQuery(year);
    }

    render() {
        const currentYear = this.props.match.params.year || this.years[this.years.length - 1];
        const query = currentYear ? {
            year: currentYear
        } : null;
        const settings = {
            min: this.years[0],
            max: this.years[this.years.length - 1],
            step: 1,
            start: this.state.year,
            onChange: this.onChange
        };

        ui.setTitle(`Browsing year ${currentYear}`);

        return (
            <div>
                <Header>
                    Browse by year
                    <span className={this.props.theme.headerInfo}>
                        {this.state.year}
                    </span>
                </Header>
                <Segment className={this.props.theme.yearSliderTable}>
                    <Button
                        className={this.props.theme.yearSliderButton}
                        icon="minus"
                        circular
                        basic
                        size="tiny"
                        disabled={this.state.year === settings.min}
                        onClick={this.onDecrease}
                    />
                    <div className={this.props.theme.yearSliderInput}>
                        <Slider
                            color="blue"
                            settings={settings}
                        />
                    </div>
                    <Button
                        className={this.props.theme.yearSliderButton}
                        icon="add"
                        circular
                        basic
                        size="tiny"
                        disabled={this.state.year === settings.max}
                        onClick={this.onIncrease}
                    />
                </Segment>
                <List
                    theme={this.props.theme}
                    query={query}
                    onLoad={this.onLoad}
                />
            </div>
        );
    }
}

Year.propTypes = {
    theme: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

Year.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Year;
