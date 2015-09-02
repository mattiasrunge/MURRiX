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

            var s1 = this.itemId.subscribe(this.load);
            this.load();

            this.dispose = function() {
                s1.dispose();
            };

            var $element = $("body");
            this.imageUrl = ko.pureComputed(function() {
                if (!this.item()) {
                    return false;
                }

                return "/preview?id=" + this.item()._id + "&width=1280&height=960&square=0";
            }.bind(this));
            var videoUrl = this.videoUrl = ko.observable(false);
            var commentText = this.commentText = ko.observable("");
            var errorText = this.errorText = ko.observable(false);
            var loading = this.loading = ko.observable(false);

            var index = this.index = ko.observable(0);
            var count = this.count = ko.observable(0);
            var next = this.next = ko.observable(false);
            var previous = this.previous = ko.observable(false);
            var mediaList = this.mediaList = ko.observableArray();
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

            };

            this.toggleFullscreen = function() {

            };

            this.togglePlaying = function() {

            };



  var scrollable = function()
  {
    if (this.item())
    {
      $element.css("overflow-y", "hidden");
    }
    else
    {
      $element.css("overflow-y", "scroll");
    }
  }.bind(this);

  function goNext()
  {
//     var parts = document.location.hash.split("/");
//     parts.pop();
//     document.location.hash = parts.join("/") + "/" + next();
  }

  function goPrevious()
  {
//     var parts = document.location.hash.split("/");
//     parts.pop();
//     document.location.hash = parts.join("/") + "/" + previous();
  }

  playing.subscribe(function(value)
  {
    if (timer)
    {
      clearInterval(timer);
      timer = null;
    }

    if (value)
    {
      timer = setInterval(function()
      {
        goNext();
      }, 5000);
    }
  });

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
  scrollable();

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
//
//   LoadMedia.bind(this)();

  this.item.subscribe(function(value)
  {
    scrollable();
    //LoadMedia.bind(this)();
  }.bind(this));

  $(document).on("resize", function()
  {
    var $element = $(".showing-container");

    $element.removeClass("showing-container");

    setTimeout(function()
    {
      $element.addClass("showing-container");
    }, 50);
  });

  function LoadItemEnvironment()
  {
    next(false);
    previous(false);
    index(0);

    if (count() === 0 || !this.item())
    {
      return;
    }

    for (var n = 0; n < mediaList().length; n++)
    {
      if (mediaList()[n] === this.item()._id)
      {
        index(n + 1);

        if (n === 0)
        {
          previous(mediaList()[mediaList().length - 1]);
        }
        else
        {
          previous(mediaList()[n - 1]);
        }

        if (n + 1 === mediaList().length)
        {
          next(mediaList()[0]);
        }
        else
        {
          next(mediaList()[n + 1]);
        }

        break;
      }
    }
  }

//   function LoadEnvironment()
//   {
//     if (!this.node())
//     {
//       index(0);
//       count(0);
//       next(false);
//       previous(false);
//       mediaList.removeAll();
//       return;
//     }
//
//     loading(true);
//     errorText(false);
//
//     this.server.emit("node.getChildIdList", { _id: this.node()._id, types: [ "file" ] }, function(error, list)
//     {
//       loading(false);
//
//       if (error)
//       {
//         console.error(error);
//         errorText(error);
//         return;
//       }
//
//       list.sort(function(a, b)
//       {
//         if (a.timestamp === b.timestamp)
//         {
//           return 0;
//         }
//         else if (!a.timestamp)
//         {
//           return -1;
//         }
//         else if (!b.timestamp)
//         {
//           return 1;
//         }
//
//         var offset = Math.abs(Math.min(a.timestamp, b.timestamp));
//         return (offset + a.timestamp) - (offset + b.timestamp);
//       });
//
//       count(list.length);
//       mediaList.removeAll();
//
//       for (var n = 0; n < list.length; n++)
//       {
//         mediaList.push(list[n]._id);
//       }
//
//       LoadItemEnvironment();
//     });
//   };

  this.node.subscribe(function(value)
  {
    //LoadEnvironment();
  });

  //LoadEnvironment();
/*
  return {
    tools: tools,
    item: this.item,
    node: this.node,
    user: user.user,
    imageUrl: imageUrl,
    videoUrl: videoUrl,
    index: index,
    count: count,
    commentText: commentText,
    errorText: errorText,
    loading: loading,
    fullscreen: fullscreen,
    playing: playing,
    submitComment: function()
    {
      if (commentText() === "")
      {
        errorText("Can not submit an empty comment.");
        return;
      }

      loading(true);
      errorText(false);

//       this.server.emit("item.comment", { _id: this.item()._id, text: commentText() }, function(error, itemData)
//       {
//         loading(false);
//
//         if (error)
//         {
//           errorText(error);
//           return;
//         }
//
//         commentText("");
//
//         this.item(itemData);
//       });
    },
    close: function()
    {
//       var parts = document.location.hash.split("/");
//       parts.pop();
//       document.location.hash = parts.join("/");
    },
    goNext: goNext,
    goPrevious: goPrevious,
    toggleFullscreen: function()
    {
//       event.stopPropagation();
//       event.preventDefault();
//
//       if (fullscreen())
//       {
//         tools.document.exitFullscreen();
//       }
//       else
//       {
//         tools.document.enterFullscreen();
//       }
    },
    togglePlaying: function(data, event)
    {
//       event.stopPropagation();
//       event.preventDefault();
//
//       playing(!playing());
    },
    containerClick: function()
    {
//       playing(false);
    }
  };*/
        }
    }
});
