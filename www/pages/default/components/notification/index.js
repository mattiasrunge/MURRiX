
import ko from "knockout";
import stat from "lib/status";
import React from "react";
import Component from "lib/component";
import { NotificationStack } from "react-notification";

class Notification extends Component {
    constructor(props) {
        super(props);

        this.state = {
            list: ko.unwrap(stat.list)
        };
    }

    componentDidMount() {
        this.addDisposables([
            stat.list.subscribe((list) => this.setState({ list: list.slice(0) }))
        ]);
    }

    render() {
        return (
            <NotificationStack
                notifications={this.state.list}
                onDismiss={(notification) => notification.dismiss()}
            />
        );
    }
}

export default Notification;
