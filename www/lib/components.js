
const components = {
    "comment-widget-comments": require("plugins/comment/components/widget-comments").default,

    "people-widget-family-person": require("plugins/people/components/widget-family-person").default,
    "people-widget-partner": require("plugins/people/components/widget-partner").default,
    "people-widget-parent": require("plugins/people/components/widget-parent").default,
    "people-section-timeline": require("plugins/people/components/section-timeline").default,
    "people-section-family": require("plugins/people/components/section-family").default,
    "people-section-contact": require("plugins/people/components/section-contact").default,
    "people-page": require("plugins/people/components/page").default,

    "node-widget-card-list": require("plugins/node/components/widget-card-list").default,
    "node-widget-card": require("plugins/node/components/widget-card").default,
    "node-widget-labels": require("plugins/node/components/widget-labels").default,
    "node-widget-text-attribute": require("plugins/node/components/widget-text-attribute").default,
    "node-widget-description": require("plugins/node/components/widget-description").default,
    "node-widget-type": require("plugins/node/components/widget-type").default,
    "node-widget-when-attribute": require("plugins/node/components/widget-when-attribute").default,
    "node-widget-select-attribute": require("plugins/node/components/widget-select-attribute").default,
    "node-widget-sections": require("plugins/node/components/widget-sections").default,
    "node-widget-link-node": require("plugins/node/components/widget-link-node").default,
    "node-widget-header": require("plugins/node/components/widget-header").default,
    "node-widget-boolean-attribute": require("plugins/node/components/widget-boolean-attribute").default,
    "node-section-upload": require("plugins/node/components/section-upload").default,
    "node-section-move": require("plugins/node/components/section-move").default,
    "node-section-share": require("plugins/node/components/section-share").default,
    "node-section-media": require("plugins/node/components/section-media").default,
    "node-fullscreen": require("plugins/node/components/fullscreen").default,
    "node-page": require("plugins/node/components/page").default,

    "location-section-map": require("plugins/location/components/section-map").default,
    "location-page": require("plugins/location/components/page").default,

    "camera-page": require("plugins/camera/components/page").default,

    "feed-widget-today-marriage": require("plugins/feed/components/widget-today-marriage").default,
    "feed-widget-today-engagement": require("plugins/feed/components/widget-today-engagement").default,
    "feed-widget-today-birthday": require("plugins/feed/components/widget-today-birthday").default,
    "feed-widget-news-person": require("plugins/feed/components/widget-news-person").default,
    "feed-widget-news-location": require("plugins/feed/components/widget-news-location").default,
    "feed-widget-news-file": require("plugins/feed/components/widget-news-file").default,
    "feed-widget-news-album": require("plugins/feed/components/widget-news-album").default,
    "feed-page": require("plugins/feed/components/page").default,

    "auth-widget-picture-user": require("plugins/auth/components/widget-picture-user").default,
    "auth-widget-list-groups": require("plugins/auth/components/widget-list-groups").default,
    "auth-widget-edit-user": require("plugins/auth/components/widget-edit-user").default,
    "auth-page-reset": require("plugins/auth/components/page-reset").default,
    "auth-page-profile": require("plugins/auth/components/page-profile").default,
    "auth-page-login": require("plugins/auth/components/page-login").default,

    "album-page": require("plugins/album/components/page").default,

    "file-widget-profile-picture": require("plugins/file/components/widget-profile-picture").default,

    "map": require("www/pages/default/components/map").default
};

export default components;
