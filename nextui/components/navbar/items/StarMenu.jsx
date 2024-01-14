
import React from "react";
import { useRouter } from "next/router";
import { Dropdown, Icon } from "semantic-ui-react";
import useStars from "hooks/useStars";
import { NodeImage, NodeIcon } from "components/nodeparts";
import theme from "../theme.module.css";

const PICTURE_FORMAT = {
    width: 18,
    height: 18,
    type: "image"
};

const StarMenu = () => {
    const router = useRouter();
    const [ stars ] = useStars();

    const onClick = React.useCallback((node) => {
        router.push(`/node${node.path}`);
    }, [ router ]);

    if (stars.length === 0) {
        return null;
    }

    return (
        <Dropdown
            item
            direction="left"
            simple
            trigger={(
                <Icon
                    fitted
                    name="star"
                    style={{ margin: 0 }}
                />
            )}
            icon={null}
        >
            <Dropdown.Menu fitted="vertically">
                <For each="node" of={stars}>
                    <Dropdown.Item
                        key={node._id}
                        onClick={() => onClick(node)}
                    >
                        <NodeImage
                            className="image"
                            path={`${node.path}/profilePicture`}
                            format={PICTURE_FORMAT}
                            rounded
                            floated="right"
                        />
                        <div className={theme.starMenuText}>
                            <NodeIcon type={node.properties.type} />
                            {node.attributes.name}
                        </div>
                    </Dropdown.Item>
                </For>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default StarMenu;
