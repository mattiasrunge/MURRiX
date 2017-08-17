
const components = {
    "comment-widget-comments": require("plugins/comment/components/widget-comments").default,

    "people-widget-family-person": require("plugins/people/components/widget-family-person").default,
    "people-widget-partner": require("plugins/people/components/widget-partner").default,
    "people-widget-parent": require("plugins/people/components/widget-parent").default,
    "people-page": require("plugins/people/components/page").default,

    "node-widget-text-attribute": require("plugins/node/components/widget-text-attribute").default,
    "node-widget-description": require("plugins/node/components/widget-description").default,
    "node-widget-type": require("plugins/node/components/widget-type").default,
    "node-widget-when-attribute": require("plugins/node/components/widget-when-attribute").default,
    "node-widget-select-attribute": require("plugins/node/components/widget-select-attribute").default,
    "node-widget-link-node": require("plugins/node/components/widget-link-node").default,
    "node-fullscreen": require("plugins/node/components/fullscreen").default,

    "location-page": require("plugins/location/components/page").default,

    "camera-page": require("plugins/camera/components/page").default,

    "auth-widget-picture-user": require("plugins/auth/components/widget-picture-user").default,

    "album-page": require("plugins/album/components/page").default,

    "file-widget-profile-picture": require("plugins/file/components/widget-profile-picture").default,

    "map": require("www/pages/default/components/map").default
};

export default components;
