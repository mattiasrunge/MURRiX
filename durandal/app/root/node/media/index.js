﻿
define(['ko-ext', 'murrix'], function(ko, murrix)
{
  var errorText = ko.observable();
  var successText = ko.observable();
  var loading = ko.observable(false);
  var list = ko.observableArray();
  var loaded = false;

  murrix.node.subscribe(function()
  {
    loaded = false;
    list.removeAll();
  });
  
  return {
    errorText: errorText,
    successText: successText,
    loading: loading,
    list: list,
    node: murrix.node,
    activate: function(nodeId, itemId)
    {
      murrix.itemId(itemId ? itemId : false);
      
      if (loaded)
      {
        return;
      }
      
      loading(true);
      list.removeAll();

      murrix.server.emit("item.find", { query: { _parents: murrix.node()._id, what: 'file' } }, function(error, itemDataList)
      {
        loading(false);

        if (error)
        {
          errorText(error);
          return;
        }
        
        itemDataList.sort(function(a, b)
        {
          if (!a.when)
          {
            return -1;
          }
          else if (!b.when)
          {
            return 1;
          }
          else if (a.when.timestamp === b.when.timestamp)
          {
            return 0;
          }
          else if (!a.when.timestamp)
          {
            return -1;
          }
          else if (!b.when.timestamp)
          {
            return 1;
          }
          
          var offset = Math.abs(Math.min(a.when.timestamp, b.when.timestamp));
          return (offset + a.when.timestamp) - (offset + b.when.timestamp);
        });
        
        for (var n = 0; n < itemDataList.length; n++)
        {
          itemDataList[n].url = "/media/" + itemDataList[n]._id + "/image/250/250?";
              
          if (itemDataList[n].angle)
          {
            itemDataList[n].url += "angle=" + itemDataList[n].angle + "&";
          }
          
          if (itemDataList[n].mirror)
          {
            itemDataList[n].url += "mirror=true&";
          }
          
          if (itemDataList[n].exif.Compression === "dvsd")
          {
            itemDataList[n].url += "deinterlace=true&";
          }
          
          if (itemDataList[n].thumbPosition)
          {
            itemDataList[n].url += "timeindex=" + itemDataList[n].thumbPosition + "&";
          }
        }

        list(itemDataList);
        loaded = true;
      });
    }
  }
});
