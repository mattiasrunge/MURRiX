
define(['plugins/router', 'knockout', 'murrix', 'jquery'], function(router, ko, murrix, $)
{
  var errorText = ko.observable();
  var successText = ko.observable();
  var loading = ko.observable(false);
  var selected = ko.observableArray();
  var list = ko.observableArray();
  var labels = ko.observableArray();
  var mode = ko.observable("or");

  mode.subscribe(function(value)
  {
    if (selected().length > 0)
    {
      router.navigate("/murrix/label/" + selected().join(value === "and" ? "&" : "|"));
    }
  });

  return {
    errorText: errorText,
    successText: successText,
    loading: loading,
    list: list,
    labels: labels,
    mode: mode,
    activate: function(id)
    {
      if (!id)
      {
        selected.removeAll();
      }
      else
      {
        if (id.indexOf("&") !== -1)
        {
          selected(id.split("&"));
          mode("and");
        }
        else if (id.indexOf("|") !== -1)
        {
          selected(id.split("|"));
          mode("or");
        }
        else
        {
          selected.removeAll();
          selected.push(id);
        }
      }

      loading(true);
      list.removeAll();

      murrix.server.emit("node.getLabels", {}, function(error, labelList)
      {
        loading(false);

        if (error)
        {
          errorText(error);
          return;
        }

        var items = [];

        for (var n = 0; n < labelList.length; n++)
        {
          items.push({
            name: labelList[n],
            selected: $.inArray(labelList[n], selected()) !== -1
          });
        }

        labels(items);


        var query = {};

        if (mode() === "and")
        {
          query = { tags: { $all: selected() } };
        }
        else
        {
          query = { tags: { $in: selected() } };
        }

        loading(true);

        murrix.server.emit("node.find", { query: query }, function(error, nodeDataList)
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
      });
    },
    clicked: function(data)
    {
      var pos = $.inArray(data.name, selected());

      if (pos === -1)
      {
        selected.push(data.name);
      }
      else
      {
        //console.log(selected.slice(pos, 1));
        selected.splice(pos, 1);
      }

      router.navigate("/murrix/label/" + selected().join(mode() === "and" ? "&" : "|"));
    }
  }
});
