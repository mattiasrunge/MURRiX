
define(["plugins/router", 'ko-ext', 'murrix'], function(router, ko, murrix)
{
  var childRouter = router.createChildRouter();
  var errorText = ko.observable(false);
  var loading = ko.observable(false);
  var admins = ko.observableArray();
  var readers = ko.observableArray();
  var others = ko.observableArray();
  
 
  return {
    node: murrix.node,
    errorText: errorText,
    loading: loading,
    user: murrix.user,
    admins: admins,
    readers: readers,
    others: others,
    activate: function()
    {
      admins.removeAll();
      readers.removeAll();
      others.removeAll();

      var groupIdList = [];

      if (typeof murrix.user().admin === "undefined" || murrix.user().admin !== true)
      {
        groupIdList = murrix.user()._groups;
        groupIdList = groupIdList.concat(murrix.node()._readers, murrix.node()._admins);
      }

      murrix.server.emit("group.find", { query: { _id: { $in: groupIdList } } }, function(error, groupDataList)
      {
        if (error)
        {
          console.log("NodeModel: " + error);
          return;
        }

        var listAdmins = [];
        var listReaders = [];
        var listOthers = [];

        for (var n in groupDataList)
        {
          if (murrix.node()._admins.indexOf(groupDataList[n]._id) !== -1)
          {
            listAdmins.push(groupDataList[n]);
          }
          else if (murrix.node()._readers.indexOf(groupDataList[n]._id) !== -1)
          {
            listReaders.push(groupDataList[n]);
          }
          else
          {
            listOthers.push(groupDataList[n]);
          }
        }

        admins(listAdmins);
        readers(listReaders);
        others(listOthers);
      });
    },
    changePublic: function()
    {
    
    },
    remove: function()
    {
    },
    makeReader: function()
    {
    },
    makeAdmin: function()
    {
    }
  }
});
