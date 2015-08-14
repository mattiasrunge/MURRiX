"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/socket",
    "lib/notification",
    "lib/location"
], function(template, ko, socket, notification, location) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/home_year", false); // TODO: Dispose!
            this.sliderYear = ko.observable(new Date().getFullYear());
            this.list = ko.observableArray();
            this.sliding = ko.observable(false);
            this.type = ko.pureComputed(function() {
                return location.current().type;
            });

            this.year = ko.pureComputed(function() {
                return parseInt(location.current().year, 10) || new Date().getFullYear();
            });

            this.increase = function() {
                this.sliderYear(this.year() + 1);
            }.bind(this);

            this.decrease = function() {
                this.sliderYear(this.year() - 1);
            }.bind(this);

            this.submit = function() {
                if (!this.sliding()) {
                    location.goto({ year: this.sliderYear() });
                }
            }.bind(this);

            this.load = function() {
                this.sliderYear(this.year());
                this.list.removeAll();

                this.loading(true);

                socket.emit("findNodesByYear", this.year(), function(error, nodeDataList) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    console.log("find result", nodeDataList);
                    this.list(nodeDataList);
                }.bind(this));
            }.bind(this);

            var s1 = this.year.subscribe(this.load);
            var s2 = this.sliderYear.subscribe(this.submit);

            this.load();

            this.dispose = function() {
                s1.dispose();
                s2.dispose();
            };
        }
    };
});
