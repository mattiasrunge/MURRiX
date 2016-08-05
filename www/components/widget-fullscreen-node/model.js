"use strict";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const ui = require("lib/ui");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.showPath = ko.pureComputed(() => ko.unwrap(params.showPath));
    this.showSidebar = ko.observable(true);
    this.tagging = ko.observable(false);
    this.height = ko.pureComputed(() => {
        let screenHeight = ko.unwrap(ui.windowSize()).height;
        let heights = [ 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000 ];

        for (let height of heights) {
            if (screenHeight < height) {
                return height;
            }
        }

        return heights[heights.length - 1];
    });
    this.item = ko.asyncComputed(false, function*(setter) {
        let abspath = ko.unwrap(this.showPath);
        let tags = [];
        let versions = [];

        setter(false);

        this.loading(true);
        let item = yield api.vfs.resolve(abspath, { noerror: true });

        console.log("item", item);

        if (!item) {
            this.loading(false);
            return false;
        }

        let editable = yield api.vfs.access(abspath, "w");

        tags = yield api.vfs.list(abspath + "/tags", {
            noerror:  true
        });

        versions = yield api.vfs.list(abspath + "/versions", {
            noerror:  true
        });

        console.log("versions", versions);

        this.loading(false);

        return { node: ko.observable(item), path: abspath, tags: tags, versions: versions, editable: editable };
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.filename = ko.asyncComputed(false, function*(setter) {
        if (!this.item()) {
            return false;
        }

        setter(false);

        let height = ko.unwrap(this.height);
        let filename = false;

        this.loading(true);

        if (this.item().node().attributes.type === "image") {
            filename = (yield api.file.getPictureFilenames([ this.item().node()._id ], null, height))[0];
        } else if (this.item().node().attributes.type === "video") {
            filename = (yield api.file.getVideoFilenames([ this.item().node()._id ], null, height))[0];
        } else if (this.item().node().attributes.type === "audio") {
            filename = (yield api.file.getAudioFilenames([ this.item().node()._id ]))[0];
        }

        this.loading(false);

        return filename ? filename.filename : false;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.who = ko.asyncComputed(false, function*(setter) {
        let abspath = ko.unwrap(this.showPath) + "/createdBy";

        setter(false);

        let item = yield api.vfs.resolve(abspath, { noerror: true });

        console.log("who", item);

        if (!item) {
            return false;
        }

        abspath = yield api.vfs.lookup(item._id);

        return { node: ko.observable(item), path: abspath };
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    this.device = ko.asyncComputed(false, function*(setter) {
        let abspath = ko.unwrap(this.showPath) + "/createdWith";

        setter(false);

        let item = yield api.vfs.resolve(abspath, { noerror: true });

        console.log("device", item);

        if (!item) {
            return false;
        }

        abspath = yield api.vfs.lookup(item._id);

        return { node: ko.observable(item), path: abspath };
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    this.commentCount = ko.asyncComputed(0, function*(setter) {
        setter(0);

        let list = yield api.comment.list(ko.unwrap(this.showPath));
        return list.length;
    }.bind(this), (error) => {
        stat.printError(error);
        return 0;
    });

    this.faces = ko.asyncComputed([], function*(setter) {
        let abspath = ko.unwrap(this.showPath);

        setter([]);

        let faces = yield api.file.getFaces(abspath);

        console.log("faces", faces);

        return faces;
    }.bind(this), (error) => {
        stat.printError(error);
        return [];
    });

    this.currentIndex = ko.pureComputed(() => {
        if (!this.item()) {
            return -1;
        }

        let item = node.list().filter((item2) => item2.node._id === this.item().node()._id)[0];

        return node.list().indexOf(item);
    });

    this.nextPath = ko.pureComputed(() => {
        let index = this.currentIndex();

        if (index === -1) {
            return false;
        }

        index++;

        if (index >= node.list().length) {
            index = 0;
        }

        return node.list()[index].path;
    });

    this.previousPath = ko.pureComputed(() => {
        let index = this.currentIndex();

        if (index === -1) {
            return false;
        }

        index--;

        if (index < 0) {
            index = node.list().length - 1;
        }

        return node.list()[index].path;
    });

    this.rotate = (offset) => {
        if (!this.item().editable) {
            return;
        }

        offset = parseInt(offset, 10);

        if (this.item().node().attributes.mirror) {
            offset = -offset;
        }

        let angle = parseInt(this.item().node().attributes.angle || 0, 10) + offset;

        if (angle < 0) {
            angle += 360;
        } else if (angle > 270) {
            angle -= 360;
        }

        api.vfs.setattributes(this.item().path, { angle: angle })
        .then((node) => {
            this.item().node(node);
            console.log("Saving angle attribute as " + angle + " successfully!", node);
        })
        .catch((error) => {
            stat.printError(error);
        });
    };

    this.mirror = () => {
        if (!this.item().editable) {
            return;
        }

        let mirror = !this.item().node().attributes.mirror;

        api.vfs.setattributes(this.item().path, { mirror: mirror })
        .then((node) => {
            this.item().node(node);
            console.log("Saving mirror attribute as " + mirror + " successfully!", node);
        })
        .catch((error) => {
            stat.printError(error);
        });
    };

    $("body").css("overflow-y", "hidden");

    this.dispose = () => {
        stat.destroy(this.loading);
        $("body").css("overflow-y", "");
    };
});

/*
define(["durandal/composition", "knockout", "jquery", "murrix", "tools"], function(composition, ko, $, murrix, tools)
{
  var $element = $("body");
  var imageUrl = ko.observable(false);
  var videoUrl = ko.observable(false);
  var commentText = ko.observable("");
  var errorText = ko.observable(false);
  var loading = ko.observable(false);

  var index = ko.observable(0);
  var count = ko.observable(0);
  var next = ko.observable(false);
  var previous = ko.observable(false);
  var mediaList = ko.observableArray();
  var fullscreen = ko.observable(false);
  var playing = ko.observable(false);
  var timer = null;

  function scrollable()
  {
    if (murrix.item())
    {
      $element.css("overflow-y", "hidden");
    }
    else
    {
      $element.css("overflow-y", "scroll");
    }
  }

  function goNext()
  {
    var parts = document.location.hash.split("/");
    parts.pop();
    document.location.hash = parts.join("/") + "/" + next();
  }

  function goPrevious()
  {
    var parts = document.location.hash.split("/");
    parts.pop();
    document.location.hash = parts.join("/") + "/" + previous();
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

  tools.document.on("fullscreen:enter", function()
  {
    fullscreen(true);
  });

  tools.document.on("fullscreen:exit", function()
  {
    fullscreen(false);
  });

  scrollable();

  function LoadMedia()
  {
    if (!murrix.item())
    {
      playing(false);
      return;
    }

    if (murrix.item().what === "file")
    {
      murrix.server.emit("item.identifyMimetype", { mimetype: murrix.item().exif.MIMEType }, function(error, type)
      {
        if (error)
        {
          console.log(error);
          return;
        }

        var width = 720;
        var height = 540;

        if (type !== "audio")
        {
          width = murrix.item().exif.ImageWidth;
          height = murrix.item().exif.ImageHeight;
        }

        var url = "/media/" + murrix.item()._id + "/image/" + width + "/" + height + "?";

        if (murrix.item().angle)
        {
          url += "angle=" + murrix.item().angle + "&";
        }

        if (murrix.item().mirror)
        {
          url += "mirror=true&";
        }

        if (murrix.item().exif.Compression === "dvsd")
        {
          url += "deinterlace=true&";
        }

        if (murrix.item().thumbPosition)
        {
          url += "timeindex=" + murrix.item().thumbPosition + "&";
        }

        imageUrl(url);
        videoUrl(false);
        console.log(imageUrl(), videoUrl());

        LoadItemEnvironment();

        if (type === "video")
        {
          videoUrl(url.replace("/image/", "/video/"));
        }
        else if (type === "audio")
        {
          videoUrl(url.replace("/image/", "/audio/"));
        }
      });
    }
  }

  LoadMedia();

  murrix.item.subscribe(function(value)
  {
    scrollable();
    LoadMedia();
  });

  tools.document.on("resize", function()
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

    if (count() === 0 || !murrix.item())
    {
      return;
    }

    for (var n = 0; n < mediaList().length; n++)
    {
      if (mediaList()[n] === murrix.item()._id)
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

  function LoadEnvironment()
  {
    if (!murrix.node())
    {
      index(0);
      count(0);
      next(false);
      previous(false);
      mediaList.removeAll();
      return;
    }

    loading(true);
    errorText(false);

    murrix.server.emit("node.getChildIdList", { _id: murrix.node()._id, types: [ "file" ] }, function(error, list)
    {
      loading(false);

      if (error)
      {
        console.error(error);
        errorText(error);
        return;
      }

      list.sort(function(a, b)
      {
        if (a.timestamp === b.timestamp)
        {
          return 0;
        }
        else if (!a.timestamp)
        {
          return -1;
        }
        else if (!b.timestamp)
        {
          return 1;
        }

        var offset = Math.abs(Math.min(a.timestamp, b.timestamp));
        return (offset + a.timestamp) - (offset + b.timestamp);
      });

      count(list.length);
      mediaList.removeAll();

      for (var n = 0; n < list.length; n++)
      {
        mediaList.push(list[n]._id);
      }

      LoadItemEnvironment();
    });
  };

  murrix.node.subscribe(function(value)
  {
    LoadEnvironment();
  });

  LoadEnvironment();

  return {
    tools: tools,
    item: murrix.item,
    node: murrix.node,
    user: murrix.user,
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

      murrix.server.emit("item.comment", { _id: murrix.item()._id, text: commentText() }, function(error, itemData)
      {
        loading(false);

        if (error)
        {
          errorText(error);
          return;
        }

        commentText("");

        murrix.item(itemData);
      });
    },
    close: function()
    {
      var parts = document.location.hash.split("/");
      parts.pop();
      document.location.hash = parts.join("/");
    },
    goNext: goNext,
    goPrevious: goPrevious,
    toggleFullscreen: function()
    {
      event.stopPropagation();
      event.preventDefault();

      if (fullscreen())
      {
        tools.document.exitFullscreen();
      }
      else
      {
        tools.document.enterFullscreen();
      }
    },
    togglePlaying: function(data, event)
    {
      event.stopPropagation();
      event.preventDefault();

      playing(!playing());
    },
    containerClick: function()
    {
      playing(false);
    }
  };
});*/
