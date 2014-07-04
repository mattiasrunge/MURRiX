
define([
  "zone", 
  "router", 
  "text!./index.html",
  "./recent/index",
  "./name/index",
  "./label/index",
  "ko-ext",
  "bootstrap", 
  "murrix",
  "when"
], function(zone, router, template, ZoneRecent, ZoneName, ZoneLabel, ko, bootstrap, murrix, when)
{
//   var childRouter = router.createChildRouter().makeRelative({
//     moduleId: "root/murrix",
//     fromParent: true
//   }).map([
//     { route: ["", "search_recent"],     moduleId: "recent/index",       title: "Recent",              type: "search", name: "Recent",   icon: "fa-bell",        nav: true, sort: 1 },
//     { route: "search",                  moduleId: "name/index",         title: "Search by name",      type: "search", name: "Name",     icon: "fa-search",      nav: true, sort: 2 },
//     { route: "search/:id",              moduleId: "name/index",         title: "Search by name",                                                                nav: true },
//     { route: "year",                    moduleId: "year/index",         title: "Browse by year",      type: "search", name: "Year",     icon: "fa-clock-o",     nav: true, sort: 3 },
//     { route: "year/:id",                moduleId: "year/index",         title: "Browse by year",                                                                nav: true },
//     { route: "label",                   moduleId: "label/index",        title: "Browse by labels",    type: "search", name: "Label",    icon: "fa-tag",         nav: true, sort: 4 },
//     { route: "label/:id",               moduleId: "label/index",        title: "Browse by labels",                                                              nav: true },
//     { route: "settings",                moduleId: "settings/index",     title: "Settings",            type: "admin",  name: "Settings", icon: "fa-cog",         nav: true, sort: 1 },
//     { route: "users",                   moduleId: "users/index",        title: "Users",               type: "admin",  name: "Users",    icon: "fa-user",        nav: true, sort: 2 },
//     { route: "users/:id",               moduleId: "users/index",        title: "Users",                                                                         nav: true },
//     { route: "groups",                  moduleId: "groups/index",       title: "Groups",              type: "admin",  name: "Groups",   icon: "fa-group",       nav: true, sort: 3 },
//     { route: "groups/:id",              moduleId: "groups/index",       title: "Groups",                                                                        nav: true },
//     { route: "profile",                 moduleId: "profile/index",      title: "Profile",                                                                       nav: true },
//   ]).buildNavigationModel();

  

  
  return zone({
    template: template,
    route: "/home",
    zones: [ ZoneRecent, ZoneName, ZoneLabel ],
    onInit: function() {
      this.model.user = murrix.user;
      this.model.userNode = murrix.userNode;
      this.model.visited = ko.observableArray();
      
      this.model.searchLinks = ko.computed(function() {
        var list = [];
        
        for (var n = 0; n < this.model.zones().length; n++) {
          list.push({
            active: this.model.zones()[n].isActive(),
            path: this.model.zones()[n].getPath(),
            icon: this.model.zones()[n].model.icon,
            title: this.model.zones()[n].model.title
          });
        }
        
        return list;
      }.bind(this));
      
      this.model.adminRoutes = ko.computed(function()
      {
  //       return ko.utils.arrayFilter(childRouter.navigationModel(), function(route)
  //       {
  //         return route.type === "admin";
  //       }).sort(function(a, b)
  //       {
  //         return a.sort - b.sort;
  //       });
        return [];
      }.bind(this));
    },
    onLoad: function(d, args) {
      if (murrix.user() === false) {
        d.resolve({ "redirect": "/signin" });
        return;
      }
      
      function loadVisited(d) {
        var ids = [];
        
        if (murrix.user() !== false && murrix.user()._visited) {
          ids = murrix.user()._visited;
        }
        
        if (ids.length === 0) {
          d.resolve();
          return;
        }
        
        murrix.server.emit("node.find", { query: { _id: { $in: ids } } }, function(error, nodeDataList) {
          if (error) {
            d.reject(error);
            return;
          }

          var nodeList = nodeDataList.filter(function(element) {
            return ids.indexOf(element._id) !== -1;
          });

          this.model.visited(nodeList);
          d.resolve();
        }.bind(this));
      }
      
      murrix.user.subscribe(function(value) {
        var d = when.defer();
        
        loadVisited.bind(this)(d);
        
        d.promise.catch(function(error) {
          console.error(error);
        });
      }.bind(this));
    
      loadVisited.bind(this)(d);
    }
  });
});
