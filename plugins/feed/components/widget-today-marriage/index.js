
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import format from "lib/format";
import loc from "lib/location";

class FeedWidgetTodayMarriage extends Component {
    onClick(event, path) {
        event.preventDefault();

        loc.goto({ page: "node", path: path }, false);
    }

    render() {
        return (
            <div>
                <i className="material-icons md-24">favorite</i>
                <div className="today-title">
                    <If condition={!this.props.nodepath.person2}>
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e, this.props.nodepath.person1.path)}
                        >
                            {this.props.nodepath.person1.node.attributes.name}
                        </a>
                        <span> celebrates </span>
                        {this.props.nodepath.person1.node.attributes.gender === "m" ? "his" : "her"}
                        {" "}
                        {format.number(this.props.nodepath.years)}
                        <span> wedding anniversary</span>
                    </If>
                    <If condition={this.props.nodepath.person2}>
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e, this.props.nodepath.person1.path)}
                        >
                            {this.props.nodepath.person1.node.attributes.name}
                        </a>
                        <span> and </span>
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e, this.props.nodepath.person2.path)}
                        >
                            {this.props.nodepath.person2.node.attributes.name}
                        </a>
                        <span> celebrates their </span>
                        {format.number(this.props.nodepath.years)}
                        <span> wedding anniversary</span>
                    </If>
                </div>
            </div>

        );
    }
}

FeedWidgetTodayMarriage.propTypes = {
    nodepath: PropTypes.object.isRequired
};

export default FeedWidgetTodayMarriage;
