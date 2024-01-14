
import React from "react";
import PropTypes from "prop-types";
import { Header, Card } from "semantic-ui-react";
import useActionTypes from "hooks/useActionTypes";
import ListAction from "./lib/ListAction";
import theme from "./theme.module.css";

const Actions = ({ node }) => {
    const [ actions ] = useActionTypes(node.properties.type);

    return (
        <div>
            <Header
                as="h2"
                content="Actions"
                subheader={{
                    content: "Execute actions"
                }}
            />
            <Card.Group itemsPerRow="2">
                <For each="action" of={actions}>
                    <Choose>
                        <When condition={action.type === "list"}>
                            <ListAction
                                key={action.name}
                                theme={theme}
                                action={action}
                                node={node}
                            />
                        </When>
                    </Choose>
                </For>
            </Card.Group>
        </div>
    );
};

Actions.propTypes = {
    node: PropTypes.object.isRequired
};

export default Actions;
