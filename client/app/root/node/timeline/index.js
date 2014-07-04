
define(['ko-ext', 'murrix', 'moment'], function(ko, murrix, moment)
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

      murrix.server.emit("item.find", { query: { _parents: murrix.node()._id, what: { $in: [ 'file', 'text' ] } } }, function(error, itemDataList)
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
        
        var timestampList = {};
        var ordinaryList = [];

        for (var n = 0; n < itemDataList.length; n++)
        {
          var key = "Unknown date";
          var sortKey = "0";
          
          if (itemDataList[n].when !== false && itemDataList[n].when !== null && itemDataList[n].when.timestamp !== false && itemDataList[n].when.timestamp !== null)
          {
            var time = moment.utc(itemDataList[n].when.timestamp * 1000).local();
            key = time.format("dddd, MMMM Do YYYY");
            sortKey = time.format("YYYYMMDD");
          }
          
          timestampList[key] = timestampList[key] || {};
          timestampList[key].date = key;
          timestampList[key].sortKey = sortKey;
          timestampList[key].texts = timestampList[key].texts || [];
          timestampList[key].files = timestampList[key].files || [];
          
          if (itemDataList[n].what === "file")
          {
            itemDataList[n].url = "/media/" + itemDataList[n]._id + "/image/80/80?";
            
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

            timestampList[key].files.push(itemDataList[n]);
          }
          else if (itemDataList[n].what === "text")
          {
            timestampList[key].texts.push(itemDataList[n]);
          }
        }
        
        for (var key in timestampList)
        {
          ordinaryList.push(timestampList[key]);
        }
        
        ordinaryList.sort(function(a, b)
        {
          if (a.sortKey < b.sortKey)
          {
            return -1;
          }
          else if (a.sortKey > b.sortKey)
          {
            return 1;
          }
          
          return 0;
        });

        list(ordinaryList);
        loaded = true;
      });
    }
  }
});
