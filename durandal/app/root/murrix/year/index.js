
define(['plugins/router', 'knockout', 'jquery-ui', 'bootstrap', 'moment', 'murrix'], function(router, ko, ui, bootstrap, moment, murrix)
{
  var errorText = ko.observable();
  var successText = ko.observable();
  var loading = ko.observable(false);
  var year = ko.observable(new Date().getFullYear());
  var sliding = ko.observable(false);
  var list = ko.observableArray();
  var timer = false;

  ko.bindingHandlers.slider = {
    update: function(element, valueAccessor)
    {
      var options = valueAccessor();

      $(element).slider({
        value: ko.utils.unwrapObservable(options.year),
        min: options.min ? options.min : 1800,
        max: options.max ? options.max : new Date().getFullYear(),
        step: 1,
        start: function(event, ui) { options.sliding(true); },
        slide: function(event, ui) { options.year(ui.value); },
        stop: function(event, ui) { options.sliding(false); options.year.valueHasMutated(); }
      });

      if (options.loading)
      {
        options.loading.subscribe(function(value)
        {
          $(element).slider(value ? "disable" : "enable");
        });
      }
    }
  };

  ko.bindingHandlers.increase = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();

      $(element).on('click', function(event)
      {
        event.preventDefault();
        event.stopPropagation();

        if (loading())
        {
          return;
        }

        value(parseInt(value(), 10) + 1);
      });
    }
  };

  ko.bindingHandlers.decrease = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();

      $(element).on('click', function(event)
      {
        event.preventDefault();
        event.stopPropagation();

        if (loading())
        {
          return;
        }

        value(parseInt(value(), 10) - 1);
      });
    }
  };

  year.subscribe(function(value)
  {
    if (timer)
    {
      clearTimeout(timer);
      timer = false;
    }

    if (!sliding())
    {
      timer = setTimeout(function()
      {
        timer = false;
        router.navigate("/murrix/year/" + value);
      }, 200);
    }
  });

  return {
    errorText: errorText,
    successText: successText,
    loading: loading,
    year: year,
    sliding: sliding,
    list: list,
    activate: function(id)
    {
      if (!id)
      {
        id = new Date().getFullYear();
      }

      sliding(true);
      year(id);
      sliding(false);

      var startTime = moment([ year() ]);
      var endTime = startTime.clone().add("years", 1);

      loading(true);
      list.removeAll();

      murrix.server.emit("node.findByYear", { year: id }, function(error, nodeDataList)
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
    canActivate: function()
    {
      if (murrix.user() === false)
      {
        return { redirect: "signin" };
      }
      
      return true;
    }
  }
});
