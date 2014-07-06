//   childRouter
//   .reset()
//   .makeRelative({
//     moduleId: "root/node/edit",
//     fromParent: true,
//     dynamicHash: ":id"
//   })
//   .map([
//     { route: ["", "overview"],                moduleId: "overview/index",    name: "Overview",    type: "overview",  nav: true,  title: "Overview" },
//     { route: "timeline/:id*details",          moduleId: "timeline/index",                                                        title: "Timeline" },
//     { route: "timeline",                      moduleId: "timeline/index",    name: "Timeline",    type: "timeline",  nav: true,  title: "Timeline" },
//     { route: "media/:id*details",             moduleId: "media/index",                                                           title: "Media" },
//     { route: "media",                         moduleId: "media/index",       name: "Media",       type: "media",     nav: true,  title: "Media" },
//     { route: "map/:id*details",               moduleId: "map/index",                                                             title: "Map" },
//     { route: "map",                           moduleId: "map/index",         name: "Map",         type: "map",       nav: true,  title: "Map" },
//     { route: "family",                        moduleId: "family/index",      name: "Family",      type: "family",    nav: true,  title: "Family" },
//     { route: "edit",                          moduleId: "edit/index",        name: "Edit",        type: "edit",      nav: true,  title: "Edit" },
//     { route: "edit/*details",                 moduleId: "edit/index",                                                            title: "Edit" }
//   ])
//   .mapUnknownRoutes("../../notfound/index", "")
//   .buildNavigationModel();
define([
  "zone",
  "text!./index.html",
  "knockout",
  "murrix",
  "tools",
  "./overview/index",
  "./timeline/index",
  "./media/index",
  "./map/index",
  "./edit/index"
], function(zone, template, ko, murrix, tools, ZoneOverview, ZoneTimeline, ZoneMedia, ZoneMap, ZoneEdit) {
  return zone({
    template: template,
    route: "/node/:nodeId",
    transition: "entrance-in-fade",
    zones: [ ZoneOverview, ZoneTimeline, ZoneMedia, ZoneMap, ZoneEdit ],
    onInit: function() {
      this.model.node = murrix.node;
      this.model.item = murrix.item;
      this.model.scrollTop = ko.observable(0);
      this.model.showSmall = ko.observable(false);
      this.model.smallMenu = ko.computed(function() {
        return this.model.scrollTop() >= 200 || this.model.showSmall();
      }.bind(this));
      this.model.nodeLinks = ko.computed(function() {
        return this.model.zones().filter(function(element) {
          return element.model.type && element.model.type() === "node";
        }).map(function(element) {
          return {
            active: element.model.active,
            path: element.model.activePath,
            title: element.model.title
          };
        });
      }.bind(this));
      
      /*
      childRouter.on("router:route:activating", function(main, fragment)
      {
        showSmall(fragment.config.type === "map" || fragment.config.type === "family");
      });*/
      
      this.scrollHandler = function() {
        this.model.scrollTop($(window).scrollTop());
      }.bind(this);
    },
    onLoad: function(d, args) {
      murrix.nodeId(args.nodeId ? args.nodeId : false);
      
      d.resolve();
    },
    onShow: function(d) {
      tools.document.on("scroll", this.scrollHandler);
      d.resolve();
    },
    onHide: function(d) {
      tools.document.off("scroll", this.scrollHandler);
      d.resolve();
    }
  });
});
