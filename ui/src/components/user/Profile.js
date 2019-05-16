
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
// import { Input, Header, Button, Form, Grid } from "semantic-ui-react";
import { cmd } from "lib/backend";
import session from "lib/session";
import Component from "lib/component";
// import { Focus } from "components/utils";
// import { NodeInput } from "components/nodeparts";
import { Edit } from "components/edit";

class Profile extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            loading: false,
            error: false,
            username: "",
            name: "",
            person: null
        };
    }

    async load() {
        this.addDisposable(session.on("update", (event, user) => this.setState({ user })));
    }

    resetPassword() {
        this.props.history.push(`/reset/${this.state.username}`);
    }

    async save() {
        if (!this.state.username || !this.state.password) {
            return;
        }

        this.setState({ loading: true, error: false });

        try {
            await cmd.login(this.state.username, this.state.password);
            this.setState({ loading: false });
        } catch (error) {
            this.logError("Failed to login", error);
            this.setState({ loading: false, error: "Failed to login" });
        }
    }

    close() {
        this.props.history.goBack();
    }

    render() {
        console.log(this.state.user);

        return (
            <Edit
                node={this.state.user}
            />
        );

        // return (
        //     <div>
        //         <Header>Profile</Header>
        //         <Grid columns="2">
        //             <Grid.Column width="8">
        //                 <Form>
        //                     <Form.Field>
        //                         <label>Name</label>
        //                         <Focus>
        //                             <Input
        //                                 value={this.state.name}
        //                                 onChange={(e, { value }) => this.setState({ name: value })}
        //                                 onKeyDown={(e) => e.which === 13 && this.save()}
        //                             />
        //                         </Focus>
        //                     </Form.Field>
        //                     <Form.Field>
        //                         <label>E-Mail</label>
        //                         <Input
        //                             value={this.state.username}
        //                             onChange={(e, { value }) => this.setState({ username: value })}
        //                             onKeyDown={(e) => e.which === 13 && this.save()}
        //                         />
        //                     </Form.Field>
        //                     <Form.Field>
        //                         <label>Person</label>
        //                         <NodeInput
        //                             value={this.state.person}
        //                             paths={[
        //                                 "/people"
        //                             ]}
        //                             onChange={(value) => this.setState({ person: value })}
        //                             onKeyDown={(e) => e.which === 13 && this.save()}
        //                         />
        //                     </Form.Field>
        //
        //                     <Button
        //                         primary
        //                         loading={this.state.loading}
        //                         disabled={!this.state.name || !this.state.username}
        //                         icon="save"
        //                         content="Save"
        //                         onClick={() => this.save()}
        //                     />
        //                 </Form>
        //             </Grid.Column>
        //         </Grid>
        //     </div>
        // );
    }
}

Profile.propTypes = {
    history: PropTypes.object.isRequired
};

export default withRouter(Profile);
