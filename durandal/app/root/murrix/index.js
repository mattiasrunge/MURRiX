
define(['plugins/router', 'knockout', 'bootstrap', 'murrix'], function(router, ko, bootstrap, murrix)
{
  var childRouter = router.createChildRouter().makeRelative({
    moduleId: 'root/murrix',
    fromParent: true
  }).map([
    { route: ['', 'search_recent'],     moduleId: 'recent/index',       title: 'Recent',              type: 'search', name: 'Recent',   icon: 'icon-bell',        nav: true, sort: 1 },
    { route: 'search',                  moduleId: 'name/index',         title: 'Search by name',      type: 'search', name: 'Name',     icon: 'icon-search',      nav: true, sort: 2 },
    { route: 'search/:id',              moduleId: 'name/index',         title: 'Search by name',                                                                  nav: true },
    { route: 'year',                    moduleId: 'year/index',         title: 'Browse by year',      type: 'search', name: 'Year',     icon: 'icon-time',        nav: true, sort: 3 },
    { route: 'year/:id',                moduleId: 'year/index',         title: 'Browse by year',                                                                  nav: true },
    { route: 'label',                   moduleId: 'label/index',        title: 'Browse by labels',    type: 'search', name: 'Label',    icon: 'icon-tag',         nav: true, sort: 4 },
    { route: 'label/:id',               moduleId: 'label/index',        title: 'Browse by labels',                                                                nav: true },
    { route: 'settings',                moduleId: 'settings/index',     title: 'Settings',            type: 'admin',  name: 'Settings', icon: 'icon-cog',         nav: true, sort: 1 },
    { route: 'users',                   moduleId: 'users/index',        title: 'Users',               type: 'admin',  name: 'Users',    icon: 'icon-user',        nav: true, sort: 2 },
    { route: 'users/:id',               moduleId: 'users/index',        title: 'Users',                                                                           nav: true },
    { route: 'groups',                  moduleId: 'groups/index',       title: 'Groups',              type: 'admin',  name: 'Groups',   icon: 'icon-group',       nav: true, sort: 3 },
    { route: 'groups/:id',              moduleId: 'groups/index',       title: 'Groups',                                                                          nav: true },
    { route: 'profile',                 moduleId: 'profile/index',      title: 'Profile',                                                                         nav: true },
  ]).buildNavigationModel();

  return {
    user: murrix.user,
    router: childRouter,
    searchRoutes: ko.computed(function()
    {
      return ko.utils.arrayFilter(childRouter.navigationModel(), function(route)
      {
        return route.type === 'search';
      }).sort(function(a, b)
      {
        return a.sort - b.sort;
      });
    }),
    adminRoutes: ko.computed(function()
    {
      return ko.utils.arrayFilter(childRouter.navigationModel(), function(route)
      {
        return route.type === 'admin';
      }).sort(function(a, b)
      {
        return a.sort - b.sort;
      });
    }),
  };
});
