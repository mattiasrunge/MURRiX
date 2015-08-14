
define([
    "knockout",
    "moment",
    "notify",
    "jquery",
    "mprogress"
], function(ko, moment, notify, $, Mprogress) {
    var Notification = function() {
        this.mprogress = new Mprogress({ template: 4 });
        this.loadingObservables = ko.observableArray();
        this.loading = ko.computed(function() {
            var loading = false;

            for (var n = 0; n < this.loadingObservables().length; n++) {
                if (this.loadingObservables()[n].loading()) {
                   loading = true;
                   break;
                }
            }

            if (loading) {
                this.mprogress.start();
            } else {
                this.mprogress.end();
            }

            return loading;
        }.bind(this));

        this.error = function(text) {
            $.notify(text, {
                allow_dismiss: true,
                type: "danger",
                delay: 20000,
                offset: {
                    x: 8,
                    y: 60
                }
            });
            console.error("ERROR", text);
        }.bind(this);

        this.success = function(text) {
            $.notify(text, {
                allow_dismiss: true,
                type: "success",
                delay: 15000,
                offset: {
                    x: 8,
                    y: 60
                }
            });
            console.log("SUCCESS", text);
        }.bind(this);

        this.info = function(text) {
            $.notify(text, {
                allow_dismiss: true,
                type: "info",
                delay: 60000,
                offset: {
                    x: 8,
                    y: 60
                }
            });
            console.log("INFO", text);
        }.bind(this);

        this.loadObservable = function(name, defaultValue) {
            var item = this.loadingObservables().filter(function(item) {
                return item.name === name;
            })[0];

            var loading;

            if (!item) {
                loading = ko.observable(defaultValue);
                this.loadingObservables.push({ name: name, loading: loading });
            } else {
                loading = item.loading;
            }

            return loading;
        }.bind(this);
    };

    return new Notification();
});
