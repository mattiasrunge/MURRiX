/* global define, console */

define([
  "jquery",
  "knockout"
], function($, ko) {
  "use strict";
  return function(lifecycle) {
    ko.bindingHandlers[lifecycle.name] = {
      init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        element.model = {};
        element.subscriptions = [];
        element.element = $(lifecycle.template).get(0);
      
        if (!element.element) {
          console.error("Could not create element from template", element);
          return false;
        }
        
        lifecycle.onCreate = lifecycle.onCreate || function() {};
        lifecycle.onDestroy = lifecycle.onDestroy || function() {};
        
        lifecycle.onCreate.bind(element)(valueAccessor());
        
        ko.applyBindings(element.model, element.element);
        $(element).empty();
        $(element.element).appendTo(element);
      
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
          lifecycle.onDestroy.bind(element)();
          
          ko.removeNode(element.element);
          
          for (var n = 0; n < element.subscriptions.length; n++) {
            element.subscriptions[n].dispose();
          }
        });

        return { controlsDescendantBindings: true };
      }
    };
  };
});
