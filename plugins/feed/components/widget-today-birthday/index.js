
import ko from "knockout";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import format from "lib/format";
import loc from "lib/location";

class FeedWidgetTodayBirthday extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nodepath: ko.unwrap(props.nodepath)
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.nodepath)) {
            this.addDisposables([
                this.props.nodepath.subscribe((nodepath) => this.setState({ nodepath }))
            ]);
        }
    }

    onClick(event, path) {
        event.preventDefault();

        loc.goto({ page: "node", path: path }, false);
    }

    render() {
        return (
            <div>
                <i className="material-icons md-24">cake</i>
                <div className="today-title">
                    <a
                        href="#"
                        onClick={(e) => this.onClick(e, this.state.nodepath.person.path)}
                    >
                        {this.state.nodepath.person.node.attributes.name}
                    </a>
                    <If condition={this.state.nodepath.ageAtDeath === false}>
                        <span> celebrates </span>
                        {this.state.nodepath.person.node.attributes.gender === "m" ? "his" : "her"}
                        {" "}
                        {format.number(this.state.nodepath.ageNow)}
                        <span> birthday</span>
                    </If>
                    <If condition={this.state.nodepath.ageAtDeath !== false}>
                        <span> would have celebrated </span>
                        {this.state.nodepath.person.node.attributes.gender === "m" ? "his" : "her"}
                        {" "}
                        {format.number(this.state.nodepath.ageNow)}
                        <span> birthday (died at age {this.state.nodepath.ageAtDeath})</span>
                    </If>
                </div>
            </div>
        );
    }
}

FeedWidgetTodayBirthday.propTypes = {
    nodepath: PropTypes.any
};

export default FeedWidgetTodayBirthday;
