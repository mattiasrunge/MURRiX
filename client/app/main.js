
requirejs.config({
  paths: {
    "text": "../bower_components/requirejs-text/text",
    "tpl": "../bower_components/requirejs-tpl/lib/tpl",
    "knockout": "../bower_components/knockoutjs/dist/knockout.debug",
    "bootstrap": "../bower_components/bootstrap/dist/js/bootstrap.min",
    "jquery": "../bower_components/jquery/dist/jquery.min",
    "moment": "../bower_components/moment/min/moment.min",
    "jquery-cookie": "../bower_components/jquery-cookie/jquery.cookie",
    "typeahead": "../bower_components/bootstrap3-typeahead/bootstrap3-typeahead",
    "slider": "../bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.min",
    "datetimepicker": "../bower_components/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min",
    
    "zone": "../lib/zone",
    "widget": "../lib/widget",
    "router": "../lib/router",
    "notification": "../lib/notification",
    
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
    },
    "typeahead": {
      deps: ["jquery"],
      exports: "$"
    }
  }
});

define([
  "root/index",
  "router",
  "knockout",
  "jquery",
  "murrix",
  "widgets/notification/index",
  "widgets/nodeSelect/index",
  "widgets/nodeList/index",
  "widgets/timePicker/index",
  "widgets/groupList/index",
  "widgets/groupEdit/index",
  "widgets/groupAdd/index",
  "widgets/userList/index",
  "widgets/userEdit/index",
  "widgets/userAdd/index"
], function(ZoneRoot, router, ko, $, murrix) {
  document.title = "MURRiX";

  $(function() {
    var root = new ZoneRoot({
      container: "#applicationHost"
    });
    
    root.init();
    root.activate().then(function() {
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
