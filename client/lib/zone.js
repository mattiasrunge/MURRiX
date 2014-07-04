/* global define, console */

define([
  "jquery",
  "knockout",
  "router",
  "when"
], function($, ko, router, when) {
  "use strict";
  
  var idCounter = 0;
  
  ko.bindingHandlers.zone = {
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      $(element).attr("id", ko.unwrap(viewModel._id));
    }
  };

  return function(lifecycle) {
    return function(options) {

      this.options = options || {};
      this.parent = options.parent;
      this._args = false;

      this.model = {};
      this.model._id = "ZoneTarget_" + (idCounter++);
      this.model.zones = ko.observableArray();
      
      lifecycle.zones = lifecycle.zones || [];
      lifecycle.template = lifecycle.template || "<div></div>";
      lifecycle.route = lifecycle.route || false;
      lifecycle.onInit = (lifecycle.onInit || function() {}).bind(this);
      lifecycle.onLoad = (lifecycle.onLoad || function(d) { d.resolve(); }).bind(this);
      lifecycle.onShow = (lifecycle.onShow || function(d) { d.resolve(); }).bind(this);
      lifecycle.onHide = (lifecycle.onHide || function(d) { d.resolve(); }).bind(this);
      

      this.getRoute = function() {
        if (lifecycle.route === false) {
          return false;
        }

        var parentRoute = this.parent.getRoute && this.parent.getRoute() !== false ? this.parent.getRoute() : "";
        return parentRoute + lifecycle.route;
      };
      
      this.getPath = function() {
        var route = this.getRoute();
        var pos = route.indexOf("/:");
        return "#" + route.substr(0, pos === -1 ? route.length : pos);
      };

      this.init = function() {
        lifecycle.onInit();

        if (this.getRoute() !== false) {
          router.register(this.getRoute(), this);
        }

        for (var n = 0; n < lifecycle.zones.length; n++) {
          var zone = new lifecycle.zones[n]({
            parent : this
          });

          zone.init();
          this.model.zones.push(zone);
        }
      };
      
      this.load = function(args) {
        console.log("Loading zone " + lifecycle.route + " with args ", args);
        
        var jsonArgs = JSON.stringify(args);
        var d = when.defer();
        
        // Only call onLoad if argument has changed
        if (this._args !== jsonArgs) {
          this._args = jsonArgs;
          lifecycle.onLoad(d, args);
        } else {
          d.resolve();
        }
        
        return d.promise;
      };

      this.activate = function() {
        console.log("Activating zone " + lifecycle.route);
        
        var d = when.defer();
        
        if (!this._isCreated()) {
          if (this._create()) {
            lifecycle.onShow(d);
          } else {
            d.reject("Failed to create zone");
          }
        } else {
          d.resolve();
        }

        return d.promise;
      };

      this.deactivate = function() {
        console.log("Deactivating zone " + lifecycle.route);
        
        var d = when.defer();
        
        if (this._isCreated()) {
          this._args = false;
          this._destroy();
        
          lifecycle.onHide(d);
        } else {
          d.resolve();
        }
        
        return d.promise;
      };
      
      this.isActive = function() {
        return this._isCreated();
      };
      
      this._isCreated = function() {
        return !!this.element;
      };

      this._create = function() {
        if (this._isCreated()) {
          return true;
        }

        var container = null;

        if (this.options.container) {
          container = $(this.options.container).get(0);
        } else {
          if (!this.parent.element) {
            console.error("Parent zone is not created, can not create this zone", this);
            return false;
          }

          container = $(this.parent.element).find("#" + this.parent.model._id).get(0);
        }

        if (!container) {
          console.error("Could not find the designated container in parent zone", this, options.container);
          return false;
        }

        var $element = $(lifecycle.template);

        if (!$element) {
          console.error("Could not create element from template", this);
          return false;
        }

        this.element = $element.get(0);

        ko.applyBindings(this.model, this.element);
        $(container).empty();
        $element.appendTo(container);

        return true;
      };

      this._destroy = function() {
        if (!this._isCreated()) {
          return false;
        }

        var $element = $(this.element);

        $element.find("*").each(function() {
          $(this).off();
        });

        ko.removeNode(this.element);
        $element.remove();

        delete this.element;

        return true;
      };

//       var keys = Object.keys(obj);
// 
//       for (var n = 0; n < keys.length; n++) {
//         if (typeof obj[keys[n]] === "function") {
//           this[keys[n]] = obj[keys[n]].bind(this);
//         } else {
//           this[keys[n]] = obj[keys[n]];
//         }
//       }
    };
  };
});
