
import React from "react";
import { Dropdown, Icon } from "semantic-ui-react";
import { NodeIcon } from "components/nodeparts";
import { CreateModal } from "components/edit";

const AddMenu = () => {
    const [ create, setCreate ] = React.useState(false);

    const onAdd = React.useCallback((type, path) => {
        setCreate({ type, path });
    }, []);

    const onCloseAdd = React.useCallback(() => {
        setCreate(null);
    }, []);

    return (
        <>
            <If condition={create}>
                <CreateModal
                    type={create.type}
                    path={create.path}
                    onClose={onCloseAdd}
                />
            </If>
            <Dropdown
                item
                direction="left"
                simple
                trigger={(
                    <Icon
                        fitted
                        name="add"
                        style={{ margin: 0 }}
                    />
                )}
                icon={null}
            >
                <Dropdown.Menu fitted="vertically">
                    <Dropdown.Item
                        icon={(<NodeIcon type="a" />)}
                        text="Album"
                        onClick={() => onAdd("a", "/albums")}
                    />
                    <Dropdown.Item
                        icon={(<NodeIcon type="p" />)}
                        text="Person"
                        onClick={() => onAdd("p", "/people")}
                    />
                    <Dropdown.Item
                        icon={(<NodeIcon type="l" />)}
                        text="Location"
                        onClick={() => onAdd("l", "/locations")}
                    />
                    <Dropdown.Item
                        icon={(<NodeIcon type="c" />)}
                        text="Camera"
                        onClick={() => onAdd("c", "/cameras")}
                    />
                </Dropdown.Menu>
            </Dropdown>
        </>
    );
};

export default AddMenu;
