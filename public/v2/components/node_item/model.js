"use strict";

define([
    "text!./template.html",
    "knockout",
    "jquery",
    "lib/location",
    "lib/socket",
    "lib/notification",
    "lib/user",
    "lib/tools"
], function(template, ko, $, location, socket, notification, user, tools) {
    return {
        template: template,
        viewModel: function(params) {
            this.tools = tools;
            this.loading = notification.loadObservable("component/node_item", false); // TODO: Dispose!
            this.commentText = ko.observable("");
            this.commentFocus = ko.observable(false);
            this.list = ko.pureComputed(function() {
                return ko.unwrap(params.list);
            });
            this.node = ko.pureComputed(function() {
                return ko.unwrap(params.node);
            });
            this.itemId = ko.pureComputed(function() {
                return ko.unwrap(params.itemId);
            });
            this.user = user.user;

            this.itemIndex = ko.pureComputed(function() {
                var index = false;

                for (var n = 0; n < this.list().length; n++) {
                    if (this.list()[n]._id === this.itemId()) {
                        index = n;
                        break;
                    }
                }

                return index;
            }.bind(this));

            this.item = ko.observable(false);

            this.nextId = ko.pureComputed(function() {
                var index = false;

                for (var n = 0; n < this.list().length; n++) {
                    if (this.list()[n]._id === this.itemId()) {
                        index = n;
                        break;
                    }
                }

                if (index === false) {
                    return false;
                }


                index++;

                if (index >= this.list().length) {
                    index = 0;
                }

                return this.list()[index]._id;
            }.bind(this));

            this.previousId = ko.pureComputed(function() {
                var index = false;

                for (var n = 0; n < this.list().length; n++) {
                    if (this.list()[n]._id === this.itemId()) {
                        index = n;
                        break;
                    }
                }

                if (index === false) {
                    return false;
                }


                index--;

                if (index < 0) {
                    index = this.list().length - 1;
                }

                return this.list()[index]._id;
            }.bind(this));

            this.load = function() {
                if (!this.itemId()) {
                    this.item(false);
                    return;
                }

                this.loading(true);

                socket.emit("find", { query: { _id: this.itemId() }, options: { collection: "items", limit: 1 } }, function(error, itemDataList) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    console.log("find item", itemDataList);

                    if (itemDataList.length === 0) {
                        notification.error("No item found with this id");
                        return;
                    }

                    this.item(itemDataList[0]);
                }.bind(this));
            }.bind(this);

            this.submitComment = function() {
                if (this.commentText() === "") {
                    notification.error("Can not submit an empty comment.");
                    return;
                }

                this.loading(true);

                socket.emit("commentItem", { id: this.item()._id, text: this.commentText() }, function(error, itemData) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    commentText("");

                    this.item(itemData);
                }.bind(this));
            }.bind(this);

            this.regenerate = function() {
                this.loading(true);

                socket.emit("helper_nodeToolsReReadExif", { id: this.item()._id }, function(error) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    this.load();
                }.bind(this));
            }.bind(this);


            var videoUrl = this.videoUrl = ko.observable(false);

            var fullscreen = this.fullscreen = ko.observable(false);
            var playing = this.playing = ko.observable(false);
            var timer = null;

            this.close = function() {
                location.goto({ itemId: null });
            };

            this.goPrevious = function() {
                location.goto({ itemId: ko.unwrap(this.previousId) });
            }.bind(this);

            this.goNext = function() {
                location.goto({ itemId: ko.unwrap(this.nextId) });
            }.bind(this);

            this.containerClick = function() {
                playing(false);
            };

            this.toggleFullscreen = function() {

            };

            this.togglePlaying = function() {
                playing(!playing());
            };

            var scrollable = function() {
                var $element = $("body");

                if (this.item()) {
                    $element.css("overflow-y", "hidden");
                } else {
                    $element.css("overflow-y", "auto");
                }
            }.bind(this);


            var s1 = playing.subscribe(function(value) {
                if (timer) {
                    clearInterval(timer);
                    timer = null;
                }

                if (value) {
                    timer = setInterval(function() {
                        this.goNext();
                    }.bind(this), 5000);
                }
            }.bind(this));

            var s2 = this.itemId.subscribe(this.load);
            this.load();

            var s3 = this.item.subscribe(scrollable);
            scrollable();

            this.dispose = function() {
                s1.dispose();
                s2.dispose();
                s3.dispose();
            };





//   tools.document.on("fullscreen:enter", function()
//   {
//     fullscreen(true);
//   });
//
//   tools.document.on("fullscreen:exit", function()
//   {
//     fullscreen(false);
//   });
//


//   function LoadMedia()
//   {
//     if (!this.item())
//     {
//       playing(false);
//       return;
//     }
//
//     if (this.item().what === "file")
//     {
// //       this.server.emit("item.identifyMimetype", { mimetype: this.item().exif.MIMEType }, function(error, type)
// //       {
// //         if (error)
// //         {
// //           console.log(error);
// //           return;
// //         }
//
//         var type = "image"; // TODO
//
//         var width = 720;
//         var height = 540;
//
//         if (type !== "audio")
//         {
//           width = this.item().exif.ImageWidth;
//           height = this.item().exif.ImageHeight;
//         }
//
//         var url = "/media/" + this.item()._id + "/image/" + width + "/" + height + "?";
//
//         if (this.item().angle)
//         {
//           url += "angle=" + this.item().angle + "&";
//         }
//
//         if (this.item().mirror)
//         {
//           url += "mirror=true&";
//         }
//
//         if (this.item().exif.Compression === "dvsd")
//         {
//           url += "deinterlace=true&";
//         }
//
//         if (this.item().thumbPosition)
//         {
//           url += "timeindex=" + this.item().thumbPosition + "&";
//         }
//
//         imageUrl(url);
//         videoUrl(false);
//         console.log(imageUrl(), videoUrl());
//
//         LoadItemEnvironment.bind(this)();
//
//         if (type === "video")
//         {
//           videoUrl(url.replace("/image/", "/video/"));
//         }
//         else if (type === "audio")
//         {
//           videoUrl(url.replace("/image/", "/audio/"));
//         }
// //       });
//     }
//   }


        }
    }
});
