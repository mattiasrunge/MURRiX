
import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import Component from "lib/component";

class Text extends Component {
    render() {
        if (!this.props.time || !this.props.time.timestamp) {
            return (
                <div className={this.props.theme.timelineTimeContainer}>
                    <div className={this.props.theme.timelineTimeUnknown}>
                        Unknown
                    </div>
                </div>
            );
        }

        const time = moment(this.props.time.timestamp * 1000);

        let year = false;
        let date = false;
        let clock = false;

        if (this.props.time.quality === "utc" || this.props.time.accuracy === "second") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
            clock = time.format("HH:mm:ss");
        } else if (this.props.time.accuracy === "minute") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
            clock = time.format("HH:mm");
        } else if (this.props.time.accuracy === "hour") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
            clock = time.format("HH");
        } else if (this.props.time.accuracy === "day") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
        } else if (this.props.time.accuracy === "month") {
            year = time.format("YYYY");
            date = time.format("MMMM");
        } else if (this.props.time.accuracy === "year") {
            year = time.format("YYYY");
        } else {
            return console.error("Unknown accuracy type ", this.props.time);
        }

        return (
            <div className={this.props.theme.timelineTimeContainer}>
                <If condition={year}>
                    <div className={this.props.theme.timelineTimeYear}>
                        {year}
                    </div>
                </If>
                <If condition={date}>
                    <div className={this.props.theme.timelineTimeDate}>
                        {date}
                    </div>
                </If>
                <If condition={clock}>
                    <div className={this.props.theme.timelineTimeClock}>
                        {clock}
                    </div>
                </If>
            </div>
        );
    }
}

Text.propTypes = {
    theme: PropTypes.object,
    time: PropTypes.object
};

export default Text;
