
import React from "react";
import { NotificationStack } from "react-notification";
import Component from "lib/component";
import notification from "lib/notification";

class Notification extends Component {
    constructor(props) {
        super(props);

        this.state = {
            list: []
        };
    }

    componentDidMount() {
        this.addDisposables([
            notification.on("message", (event, msg) => this.setState({
                list: this.state.list.concat(msg)
            }))
        ]);
    }

    dismiss(msg) {
        this.setState({
            list: this.state.list.filter((m) => m !== msg)
        });
    }

    render() {
        return (
            <NotificationStack
                notifications={this.state.list}
                onDismiss={(msg) => this.dismiss(msg)}
            />
        );
    }
}

export default Notification;
