
import React from "react";
import { useRouter } from "next/router";
import useNode from "hooks/useNode";
import useNodePath from "hooks/useNodePath";
import { NodeInput } from "components/nodeparts";
import theme from "../theme.module.css";
import StarIcon from "./StarIcon";

const PATHS = [
    "/people",
    "/cameras",
    "/locations",
    "/albums"
];

const SearchInput = () => {
    const router = useRouter();
    const nodePath = useNodePath(router);
    const [ selected, , loading ] = useNode(nodePath);

    const onSelect = React.useCallback((selected) => {
        selected && router.push(`/node${selected.path}`);
    }, [ router ]);

    const onSearch = React.useCallback((e, query) => {
        if (e.which === 13 && !selected && query) {
            router.push(`/home/search/${query}`);
        }
    }, [ router, selected ]);

    return (
        <div className={theme.nodeSearchContainer}>
            <NodeInput
                value={selected}
                paths={PATHS}
                iconPosition="left"
                onChange={onSelect}
                loading={loading}
                placeholder="Search..."
                onKeyUp={onSearch}
            />
            <StarIcon node={selected} />
        </div>
    );
};

export default SearchInput;
