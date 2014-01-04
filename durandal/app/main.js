
requirejs.config({
  paths: {
    "text": "../lib/require/text",
    "durandal":"../lib/durandal/js",
    "plugins" : "../lib/durandal/js/plugins",
    "transitions" : "../lib/durandal/js/transitions",
    "knockout": "../lib/knockout/knockout-3.0.0",
    "bootstrap": "../lib/bootstrap/js/bootstrap",
    "jquery": "../lib/jquery/jquery-1.9.1",
    "jquery-ui": "../lib/jquery-ui/jquery-ui.min",
    "jquery-cookie": "../lib/jquery/plugins/jquery.cookie",
    "typeahead": "../lib/typeahead/typeahead",
    "moment": "../lib/moment/moment.min",
    "murrix": "../lib/murrix/murrix",
    "ko-ext": "../lib/murrix/ko.extensions",
    "tools": "../lib/murrix/tools"
    
  },
  shim: {
    "bootstrap": {
      deps: ["jquery"],
      exports: "jQuery"
    },
    "jquery-cookie": {
      deps: ["jquery"],
      exports: "jQuery"
    },
    "typeahead": {
      deps: ["jquery"],
      exports: "jQuery"
    },
  }
});

define(["durandal/system", "durandal/app", "plugins/widget", "murrix"],  function(system, app, widget, murrix)
{
  //>>excludeStart("build", true);
  system.debug(true);
  //>>excludeEnd("build");

  app.title = "MURRiX";

  app.configurePlugins({
    router:true,
    dialog: true,
    widget: true
  });

  app.start().then(function()
  {
    app.setRoot("root/shell", "entrance");

    widget.registerKind("map");
    widget.registerKind("nodeList");
    widget.registerKind("nodeSelect");
    widget.registerKind("notification");
    widget.registerKind("groupList");
    widget.registerKind("userList");
    widget.registerKind("userEdit");
    widget.registerKind("userAdd");
    widget.registerKind("groupAdd");
    widget.registerKind("groupEdit");
    widget.registerKind("itemView");
  });
});
