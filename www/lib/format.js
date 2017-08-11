
import React from "react";
import moment from "moment";

module.exports = {
    duration: (value) => {
        if (!value) {
            return "Unknown";
        }

        return moment.duration(value, "seconds").format();
    },
    datetimeDayString: (value) => {
        if (!value) {
            return "Unknown";
        }

        return moment.utc(value * 1000).calendar(null, {
            sameDay: "[Today]",
            nextDay: "[Tomorrow]",
            nextWeek: "dddd",
            lastDay: "[Yesterday]",
            lastWeek: "[Last] dddd",
            sameElse: "dddd, MMMM Do YYYY"
        });
    },
    datetimeDay: (value) => {
        if (!value) {
            return "Unknown";
        }

        const dateItem = moment.utc(value * 1000);

        if (!dateItem.date()) {
            return value;
        }

        return dateItem.format("dddd, MMMM Do YYYY");
    },
    displayTimeDay: (value) => {
        if (!value || !value.timestamp) {
            return "Unknown";
        }

        const time = moment.utc(value.timestamp * 1000);
        const formats = {
            second: "dddd, MMMM Do YYYY",
            minute: "dddd, MMMM Do YYYY",
            hour: "dddd, MMMM Do YYYY",
            day: "dddd, MMMM Do YYYY",
            month: "MMMM YYYY",
            year: "YYYY"
        };

        const format = formats[value.accuracy];

        if (!format) {
            console.error("Unknown accuracy type ", value);

            return "Error";
        }

        return time.format(format);
    },
    displayTimeline: (value) => {
        if (!value || !value.timestamp) {
            return "Unknown";
        }

        const time = moment(value.timestamp * 1000);
        let year = false;
        let date = false;
        let clock = false;

        if (value.quality === "utc" || value.accuracy === "second") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
            clock = time.format("HH:mm:ss");
        } else if (value.accuracy === "minute") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
            clock = time.format("HH:mm");
        } else if (value.accuracy === "hour") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
            clock = time.format("HH");
        } else if (value.accuracy === "day") {
            year = time.format("YYYY");
            date = time.format("dddd, MMMM Do");
        } else if (value.accuracy === "month") {
            year = time.format("YYYY");
            date = time.format("MMMM");
        } else if (value.accuracy === "year") {
            year = time.format("YYYY");
        } else {
            return console.error("Unknown accuracy type ", value);
        }

        if (year) {
            return (
                <div style={{ fontSize: 26 }}>{year}</div>
            );
        }

        if (date) {
            return (
                <div>{date}</div>
            );
        }

        if (clock) {
            return (
                <div style={{ fontSize: 12, marginTop: 5 }}>{clock}</div>
            );
        }

        return "";
    },
    displayTime: (value) => {
        if (!value || !value.timestamp) {
            return "Unknown";
        }

        const time = moment.utc(value.timestamp * 1000);
        const formats = {
            utc: "dddd, MMMM Do YYYY, HH:mm:ss Z",
            second: "dddd, MMMM Do YYYY, HH:mm:ss",
            minute: "dddd, MMMM Do YYYY, HH:mm",
            hour: "dddd, MMMM Do YYYY, HH",
            day: "dddd, MMMM Do YYYY",
            month: "MMMM YYYY",
            year: "YYYY"
        };

        const format = formats[value.accuracy];

        if (!format) {
            console.error("Unknown accuracy type ", value);

            return "Error";
        }

        return time.format(format);
    },
    datetime: (value) => {
        if (!value) {
            return "Unknown";
        }

        const format = "dddd, MMMM Do YYYY, HH:mm:ss Z";
        const dateItem = moment(value).local();

        if (!dateItem.date()) {
            return value;
        }

        return dateItem.format(format);
    },
    datetimeUtc: (value) => {
        if (!value) {
            return "Unknown";
        }

        const dateItem = moment.utc(value * 1000);

        if (!dateItem.date()) {
            return value;
        }

        return dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z");
    },
    datetimeLocal: (value) => {
        if (!value) {
            return "Unknown";
        }

        const dateItem = moment.utc(value * 1000).local();

        if (!dateItem.date()) {
            return value;
        }

        return dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z");
    },
    datetimeAgo: (value) => {
        let dateItem = null;

        if (typeof value === "number") {
            dateItem = moment.unix(value);
        } else if (typeof value === "string") {
            dateItem = moment(`${value}+0000`, "YYYY-MM-DD HH:mm:ss Z");
        } else {
            return "never";
        }

        if (!dateItem.date()) {
            return value;
        }

        return dateItem.fromNow();
    }
};