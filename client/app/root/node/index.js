
define(["plugins/router", "knockout", "murrix", "tools"], function(router, ko, murrix, tools)
{
  var childRouter = router.createChildRouter();
  var scrollTop = ko.observable(0);
  var showSmall = ko.observable(false);
  var smallMenu = ko.computed(function()
  {
    return scrollTop() >= 200 || showSmall();
  });
  
  childRouter
  .reset()
  .makeRelative({
    moduleId: "root/node/edit",
    fromParent: true,
    dynamicHash: ":id"
  })
  .map([
    { route: ["", "overview"],                moduleId: "overview/index",    name: "Overview",    type: "overview",  nav: true,  title: "Overview" },
    { route: "timeline/:id*details",          moduleId: "timeline/index",                                                        title: "Timeline" },
    { route: "timeline",                      moduleId: "timeline/index",    name: "Timeline",    type: "timeline",  nav: true,  title: "Timeline" },
    { route: "media/:id*details",             moduleId: "media/index",                                                           title: "Media" },
    { route: "media",                         moduleId: "media/index",       name: "Media",       type: "media",     nav: true,  title: "Media" },
    { route: "map/:id*details",               moduleId: "map/index",                                                             title: "Map" },
    { route: "map",                           moduleId: "map/index",         name: "Map",         type: "map",       nav: true,  title: "Map" },
    { route: "family",                        moduleId: "family/index",      name: "Family",      type: "family",    nav: true,  title: "Family" },
    { route: "edit",                          moduleId: "edit/index",        name: "Edit",        type: "edit",      nav: true,  title: "Edit" },
    { route: "edit/*details",                 moduleId: "edit/index",                                                            title: "Edit" }
  ])
  .mapUnknownRoutes("../../notfound/index", "")
  .buildNavigationModel();
  
  childRouter.on("router:route:activating", function(main, fragment)
  {
    showSmall(fragment.config.type === "map" || fragment.config.type === "family");
  });
  
  
  function scrollHandler()
  {
    scrollTop($(window).scrollTop());
  }
  
  return {
    router: childRouter,
    node: murrix.node,
    item: murrix.item,
    smallMenu: smallMenu,
    activate: function(id)
    {
      if (id)
      {
        murrix.nodeId(id.indexOf("/") !== -1 ? id.split("/")[1] : id);
      }
      
      tools.document.on("scroll", scrollHandler);
    },
    deactivate: function()
    {
      tools.document.off("scroll", scrollHandler);
    }
  };
});
