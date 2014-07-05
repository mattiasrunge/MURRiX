/* global define, window, document */

define([
  "knockout",
  "when/sequence",
  "tools"
], function(ko, sequence, tools) {
  "use strict";

  var Router = function() {
    this.routes = [];
    this.redirects = {};
    this.isNavigating = ko.observable(false);

    this.register = function(route, zone) {
      this.routes.push({ route: route, zone: zone });
    };
    
    this.addRedirect = function(routeFrom, routeTo) {
      this.redirects[routeFrom] = routeTo;
    };
    
    this.process = function() {
      var routesToActivate = [];
      var routesToDeactivate = [];
      var fragment = window.location.hash.replace("#", "");
      var query = {};
      
      fragment = fragment[fragment.length - 1] === "/" ? fragment.substr(0, fragment.length - 1) : fragment;
      
      var pos = fragment.indexOf("?");
      if (pos !== -1) {
        var queryString = fragment.substr(pos + 1);
        fragment = fragment.substr(0, pos);
        
        query = tools.parseQueryString(queryString);
      }
      
      // First check redirects
      for (var routeFrom in this.redirects) {
        if (routeFrom === fragment) {
          console.log("Redirecting to " + this.redirects[routeFrom]);
          this.navigateTo(this.redirects[routeFrom]);
          return;
        }
      }
      
      for (var n = 0; n < this.routes.length; n++) {
        var matcher = fragment.match(new RegExp(this.routes[n].route.replace(/\/:[^\s/]+/g, "(/([\\w-]+)|[]*)")));

        if (matcher) {
          var params = {};
          var args = matcher.slice(1);
          var names = this.routes[n].route.match(/:[^\s/]+/g);
          
          // Remove /stuff matches...
          args = args.filter(function(name, index) {
            return index % 2;
          });
          
          if (names) {
            for (var i = 0; i < names.length; i++) {
              params[names[i].substr(1)] = args[i];
            }
          }
          
          for (var name in query) {
            params[name] = query[name];
          }
          
          routesToActivate.push({ route: this.routes[n].route, zone: this.routes[n].zone, params: params });
        } else if (fragment !== this.routes[n].route) {
          routesToDeactivate.push({ route: this.routes[n].route, zone: this.routes[n].zone });
        }
      }

      routesToDeactivate.sort(function(a, b) {
        return b.route.length - a.route.length;
      });

      routesToActivate.sort(function(a, b) {
        return a.route.length - b.route.length;
      });
      
      this.isNavigating(true);

      var seq = [];
      console.log(routesToDeactivate);
      console.log(routesToActivate);
      
      for (n = 0; n < routesToActivate.length; n++) {
        seq.push(function(route) {
          return function() {
            return route.zone.load(route.params);
          };
        }(routesToActivate[n]));
      }
      
      for (n = 0; n < routesToDeactivate.length; n++) {
        if (routesToDeactivate[n].zone._isCreated()) {
          seq.push(function(route) {
            return function() {
              return route.zone.deactivate();
            };
          }(routesToDeactivate[n]));
        }
      }

      for (n = 0; n < routesToActivate.length; n++) {
        seq.push(function(route) {
          return function() {
            return route.zone.activate();
          };
        }(routesToActivate[n]));
      }
      
      sequence(seq)
      .then(function(results) {
        console.log("All done!", results);
        this.isNavigating(false);
        
        for (var n = 0; n < results.length; n++) {
          if (results[n]) {
            if (results[n].redirect) {
              this.navigateTo(results[n].redirect);
              return;
            }
          }
        }
      }.bind(this))
      .catch(function(error) {
        console.log(error.stack);
        console.error("Failed to activate sequence", error.toString());
      });
    };
    
    this.navigateTo = function(path) {
      if (path.length > 0 && path[0] !== "#") {
        path = "#" + path;
      }
      
      document.location.hash = path;
    };
    
    this.reload = function() {
      // TODO 
      window.location.reload();
    };
    
    this.getRoutes = function() {
      return this.routes;
    };
  };
  
  
  var router = new Router();
  
   window.onhashchange = function() {
    router.process();
  };
  
  return router;
});
