
requirejs.config({
  paths: {
    "text": "../bower_components/requirejs-text/text",
    "durandal":"../bower_components/durandal/js",
    "plugins" : "../bower_components/durandal/js/plugins",
    "transitions" : "../bower_components/durandal/js/transitions",
    "knockout": "../bower_components/knockoutjs/dist/knockout.debug",
    "bootstrap": "../bower_components/bootstrap/dist/js/bootstrap.min",
    "jquery": "../bower_components/jquery/dist/jquery.min",
    "moment": "../bower_components/moment/min/moment.min",
    "jquery-cookie": "../bower_components/jquery-cookie/jquery.cookie",
    "typeahead": "../bower_components/bootstrap3-typeahead/bootstrap3-typeahead.min",
    "slider": "../bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min",
    "route-recognizer": "../bower_components/route-recognizer/dist/route-recognizer.amd",
    "zone": "../lib/zone",
    "router": "../lib/router",
    
    "murrix": "../lib/murrix/murrix",
    "ko-ext": "../lib/murrix/ko.extensions",
    "tools": "../lib/murrix/tools"
    
  },
  packages: [
    { name: "when", location: "../bower_components/when", main: "when" }
  ],
  shim: {
    "bootstrap": {
      deps: ["jquery"],
      exports: "jQuery"
    },
    "jquery-cookie": {
      deps: ["jquery"],
      exports: "jQuery"
    }
  }
});

define(["root/shell", "router", "murrix"],  function(Shell, router, murrix)
{
  document.title = "MURRiX";

  $(function() {
    var shell = new Shell({
      container: "body"
    });
    
    shell.init();
    
    shell.activate().then(function() {
      router.addRedirect("", "/home/recent");
      router.addRedirect("/", "/home/recent");
      router.process();
    });
  });
  
  
  
//   //>>excludeStart("build", true);
//   system.debug(true);
//   //>>excludeEnd("build");
// 
//   app.title = "MURRiX";
// 
//   app.configurePlugins({
//     router:true,
//     dialog: true,
//     widget: true
//   });
// 
//   app.start().then(function()
//   {
//     app.setRoot("root/shell", "entrance");
// 
//     widget.registerKind("map");
//     widget.registerKind("nodeList");
//     widget.registerKind("nodeSelect");
//     widget.registerKind("notification");
//     widget.registerKind("groupList");
//     widget.registerKind("userList");
//     widget.registerKind("userEdit");
//     widget.registerKind("userAdd");
//     widget.registerKind("groupAdd");
//     widget.registerKind("groupEdit");
//     widget.registerKind("itemView");
//   });
});
