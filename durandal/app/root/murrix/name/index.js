
define(['plugins/router', 'knockout', 'jquery-ui', 'bootstrap', 'moment', 'murrix'], function(router, ko, ui, bootstrap, moment, murrix)
{
  var errorText = ko.observable();
  var successText = ko.observable();
  var loading = ko.observable(false);
  var query = ko.observable("");
  var list = ko.observableArray();

  return {
    errorText: errorText,
    successText: successText,
    loading: loading,
    query: query,
    list: list,
    activate: function(id)
    {
      query(id);
      loading(true);
      list.removeAll();

      murrix.server.emit("node.find", { query: { name: { $regex: ".*" + id + ".*", $options: "-i" } } }, function(error, nodeDataList)
      {
        loading(false);

        if (error)
        {
          errorText(error);
          return;
        }

        var nodeList = [];

        for (var key in nodeDataList)
        {
          nodeList.push(nodeDataList[key]);
        }

        list(nodeList);
      });
    },
    submit: function()
    {
      router.navigate("/murrix/search/" + query());
    }
  }
});
