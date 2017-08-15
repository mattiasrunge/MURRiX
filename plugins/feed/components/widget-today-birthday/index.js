
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import format from "lib/format";
import loc from "lib/location";

class FeedWidgetTodayBirthday extends Component {
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
                        onClick={(e) => this.onClick(e, this.props.nodepath.person.path)}
                    >
                        {this.props.nodepath.person.node.attributes.name}
                    </a>
                    <If condition={this.props.nodepath.ageAtDeath === false}>
                        <span> celebrates </span>
                        {this.props.nodepath.person.node.attributes.gender === "m" ? "his" : "her"}
                        {" "}
                        {format.number(this.props.nodepath.ageNow)}
                        <span> birthday</span>
                    </If>
                    <If condition={this.props.nodepath.ageAtDeath !== false}>
                        <span> would have celebrated </span>
                        {this.props.nodepath.person.node.attributes.gender === "m" ? "his" : "her"}
                        {" "}
                        {format.number(this.props.nodepath.ageNow)}
                        <span> birthday (died at age {this.props.nodepath.ageAtDeath})</span>
                    </If>
                </div>
            </div>
        );
    }
}

FeedWidgetTodayBirthday.propTypes = {
    nodepath: PropTypes.object.isRequired
};

export default FeedWidgetTodayBirthday;
