
define(['plugins/router', 'ko-ext', 'bootstrap', 'murrix'], function(router, ko, bootstrap, murrix)
{
  var childRouter = router.createChildRouter().makeRelative({
    moduleId: 'root/murrix',
    fromParent: true
  }).map([
    { route: ['', 'search_recent'],     moduleId: 'recent/index',       title: 'Recent',              type: 'search', name: 'Recent',   icon: 'fa-bell',        nav: true, sort: 1 },
    { route: 'search',                  moduleId: 'name/index',         title: 'Search by name',      type: 'search', name: 'Name',     icon: 'fa-search',      nav: true, sort: 2 },
    { route: 'search/:id',              moduleId: 'name/index',         title: 'Search by name',                                                                nav: true },
    { route: 'year',                    moduleId: 'year/index',         title: 'Browse by year',      type: 'search', name: 'Year',     icon: 'fa-clock-o',     nav: true, sort: 3 },
    { route: 'year/:id',                moduleId: 'year/index',         title: 'Browse by year',                                                                nav: true },
    { route: 'label',                   moduleId: 'label/index',        title: 'Browse by labels',    type: 'search', name: 'Label',    icon: 'fa-tag',         nav: true, sort: 4 },
    { route: 'label/:id',               moduleId: 'label/index',        title: 'Browse by labels',                                                              nav: true },
    { route: 'settings',                moduleId: 'settings/index',     title: 'Settings',            type: 'admin',  name: 'Settings', icon: 'fa-cog',         nav: true, sort: 1 },
    { route: 'users',                   moduleId: 'users/index',        title: 'Users',               type: 'admin',  name: 'Users',    icon: 'fa-user',        nav: true, sort: 2 },
    { route: 'users/:id',               moduleId: 'users/index',        title: 'Users',                                                                         nav: true },
    { route: 'groups',                  moduleId: 'groups/index',       title: 'Groups',              type: 'admin',  name: 'Groups',   icon: 'fa-group',       nav: true, sort: 3 },
    { route: 'groups/:id',              moduleId: 'groups/index',       title: 'Groups',                                                                        nav: true },
    { route: 'profile',                 moduleId: 'profile/index',      title: 'Profile',                                                                       nav: true },
  ]).buildNavigationModel();

  var visited = ko.observableArray();

  return {
    user: murrix.user,
    userNode: murrix.userNode,
    router: childRouter,
    visited: visited,
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
    activate: function()
    {
      function loadVisited()
      {
        console.log("find visited");
        if (murrix.user() === false)
        {
          return [];
        }
        
        var ids = murrix.user()._visited || [];
        
        if (ids.length === 0)
        {
          return [];
        }
        
        murrix.server.emit("node.find", { query: { _id: { $in: ids } } }, function(error, nodeDataList)
        {
          if (error)
          {
            console.error(error);
            return;
          }

          var nodeList = [];

          for (var n = 0; n < ids.length; n++)
          {
            for (var key in nodeDataList)
            {
              if (nodeDataList[key]._id === ids[n])
              {
                nodeList.push(nodeDataList[key]);
              }
            }
          }

          visited(nodeList);
        });
      }
      
      murrix.user.subscribe(function(value)
      {
        loadVisited();
      });
    
      loadVisited();
    }
  };
});
