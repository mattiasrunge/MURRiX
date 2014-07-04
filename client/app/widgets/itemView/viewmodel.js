
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
});
