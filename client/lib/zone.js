/* global define, console */

define([
  "jquery",
  "knockout",
  "router",
  "when"
], function($, ko, router, when) {
  "use strict";
  
  ko.bindingHandlers.zone = {
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      bindingContext.$data._setContainer(element);
    }
  };

  return function(lifecycle) {
    return function(options) {
      this.options = options || {};
      this.parent = options.parent;
      this.absoluteRoute = "";
      
      this._args = false;
      this._container = false;
      this._element = false;

      this.model = {};
      this.model.zones = ko.observableArray();
      this.model.active = ko.observable(false);
      this.model.path = ko.observable("#");
      this.model._setContainer = function(container) {
        this._container = container;
      }.bind(this);
      
      lifecycle.zones = lifecycle.zones || [];
      lifecycle.template = lifecycle.template || "<div></div>";
      lifecycle.route = lifecycle.route || "";
      lifecycle.onInit = (lifecycle.onInit || function() {}).bind(this);
      lifecycle.onLoad = (lifecycle.onLoad || function(d) { d.resolve(); }).bind(this);
      lifecycle.onShow = (lifecycle.onShow || function(d) { d.resolve(); }).bind(this);
      lifecycle.onHide = (lifecycle.onHide || function(d) { d.resolve(); }).bind(this);

      this.init = function() {
        lifecycle.onInit();

        // Calculate absolute route
        if (lifecycle.route !== false) {
          this.absoluteRoute = (this.parent ? this.parent.absoluteRoute : "") + lifecycle.route;
        }
        
        // Calculate the absolute path
        this.model.path("#" + this.absoluteRoute.split("/:", 1)[0]);
        
        // Register the route
        if (this.absoluteRoute !== "") {
          router.register(this.absoluteRoute, this);
        }

        // Load child zones
        for (var n = 0; n < lifecycle.zones.length; n++) {
          var zone = new lifecycle.zones[n]({
            parent : this
          });

          zone.init();
          this.model.zones.push(zone);
        }
      };
      
      this.load = function(args) {
        console.log("Loading zone " + lifecycle.absoluteRoute + " with args ", args);
        
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
        console.log("Activating zone " + lifecycle.absoluteRoute);
        
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
        console.log("Deactivating zone " + lifecycle.absoluteRoute);
        
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
      
      this._isCreated = function() {
        return !!this._element;
      };
      
      this._create = function() {
        if (this._isCreated()) {
          return true;
        }
        
        var container = false;

        if (this.options.container) {
          container = $(this.options.container).get(0);
        } else {
          if (!this.parent._element) {
            console.error("Parent zone is not created, can not create this zone", this);
            return false;
          }
          
          container = this.parent._container;
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

        this._element = $element.get(0);
        
        ko.applyBindings(this.model, this._element);
        
        $(container).empty();
        
        if (lifecycle.transition) {
          $element.addClass(lifecycle.transition);
        }
        
        $element.appendTo(container);
        this.model.active(true);

        return true;
      };

      this._destroy = function() {
        if (!this._isCreated()) {
          return false;
        }

        var $element = $(this._element);

        $element.find("*").each(function() {
          $(this).off();
        });

        ko.removeNode(this._element);
        $element.remove();

        this._element = false;
        
        this.model.active(false);

        return true;
      };
    };
  };
});
