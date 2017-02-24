#!/bin/bash

PWD=$(pwd)
SCRIPT="node --harmony_async_await $PWD/convert/convert.js"


$SCRIPT $PWD/www/pages/default/components/navbar/
$SCRIPT $PWD/www/pages/default/components/root/
$SCRIPT $PWD/www/pages/default/components/sidebar/

$SCRIPT $PWD/plugins/statistics/components/page-charts/

$SCRIPT $PWD/plugins/file/components/widget-profile-picture/
$SCRIPT $PWD/plugins/file/components/widget-grid/

$SCRIPT $PWD/plugins/album/components/page/
$SCRIPT $PWD/plugins/album/components/section-media/

$SCRIPT $PWD/plugins/auth/components/page-login/
$SCRIPT $PWD/plugins/auth/components/page-profile/
$SCRIPT $PWD/plugins/auth/components/page-reset/
$SCRIPT $PWD/plugins/auth/components/widget-edit-user/
$SCRIPT $PWD/plugins/auth/components/widget-list-groups/
$SCRIPT $PWD/plugins/auth/components/widget-navbar-user/
$SCRIPT $PWD/plugins/auth/components/widget-picture-user/
$SCRIPT $PWD/plugins/auth/components/widget-sidebar-user/

$SCRIPT $PWD/plugins/feed/components/page/
$SCRIPT $PWD/plugins/feed/components/widget-news-album/
$SCRIPT $PWD/plugins/feed/components/widget-news-file/
$SCRIPT $PWD/plugins/feed/components/widget-news-location/
$SCRIPT $PWD/plugins/feed/components/widget-news-person/
$SCRIPT $PWD/plugins/feed/components/widget-today-birthday/
$SCRIPT $PWD/plugins/feed/components/widget-today-engagement/
$SCRIPT $PWD/plugins/feed/components/widget-today-marriage/

$SCRIPT $PWD/plugins/camera/components/page/
$SCRIPT $PWD/plugins/camera/components/section-media/

$SCRIPT $PWD/plugins/location/components/page/
$SCRIPT $PWD/plugins/location/components/section-media/
$SCRIPT $PWD/plugins/location/components/section-map/

$SCRIPT $PWD/plugins/node/components/page/
$SCRIPT $PWD/plugins/node/components/fullscreen/
$SCRIPT $PWD/plugins/node/components/section-comments/
$SCRIPT $PWD/plugins/node/components/section-share/
$SCRIPT $PWD/plugins/node/components/section-upload/
$SCRIPT $PWD/plugins/node/components/widget-boolean-attribute/
$SCRIPT $PWD/plugins/node/components/widget-header/
$SCRIPT $PWD/plugins/node/components/widget-link-node/
$SCRIPT $PWD/plugins/node/components/widget-sections/
$SCRIPT $PWD/plugins/node/components/widget-select-attribute/
$SCRIPT $PWD/plugins/node/components/widget-when-attribute/
$SCRIPT $PWD/plugins/node/components/widget-type/
$SCRIPT $PWD/plugins/node/components/widget-description/
$SCRIPT $PWD/plugins/node/components/widget-text-attribute/
$SCRIPT $PWD/plugins/node/components/widget-labels/
$SCRIPT $PWD/plugins/node/components/widget-card/
$SCRIPT $PWD/plugins/node/components/widget-card-list/

$SCRIPT $PWD/plugins/people/components/page/
$SCRIPT $PWD/plugins/people/components/section-contact/
$SCRIPT $PWD/plugins/people/components/section-family/
$SCRIPT $PWD/plugins/people/components/section-media/
$SCRIPT $PWD/plugins/people/components/section-timeline/
$SCRIPT $PWD/plugins/people/components/widget-parent/
$SCRIPT $PWD/plugins/people/components/widget-partner/
$SCRIPT $PWD/plugins/people/components/widget-family-person/

$SCRIPT $PWD/plugins/comment/components/widget-comments/

$SCRIPT $PWD/plugins/search/components/page-labels/
$SCRIPT $PWD/plugins/search/components/page-search/
$SCRIPT $PWD/plugins/search/components/page-year/
