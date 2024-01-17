
import React from "react";
import PropTypes from "prop-types";
import { NotificationManager } from "react-notifications";
import { Rating } from "semantic-ui-react";
import { api } from "lib/backend";
import useStars from "hooks/useStars";
import theme from "../theme.module.css";

const StarIcon = ({ node }) => {
    const [ stars ] = useStars();

    const onToggleStar = React.useCallback(async () => {
        try {
            await api.star(node.path);
        } catch (error) {
            console.error("Failed to toggle star", error);
            NotificationManager.error(`Failed to toggle star, ${error.message}`);
        }
    }, [ node ]);

    const starred = React.useMemo(() => {
        if (!node) {
            return false;
        }

        return stars.some(({ path }) => path === node.path);
    }, [ node, stars ]);

    if (!node) {
        return null;
    }

    return (
        <Rating
            className={theme.navbarStarIcon}
            icon="star"
            size="huge"
            rating={starred ? 1 : 0}
            onRate={onToggleStar}
        />
    );
};

StarIcon.propTypes = {
    node: PropTypes.object
};

export default StarIcon;
