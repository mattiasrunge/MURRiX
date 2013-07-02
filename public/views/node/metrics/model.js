
var MetricsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "metrics"))
    {
      self.show(value.action === "metrics");
    }
  });

  self.enabled = ko.observable(true);

  self.show.subscribe(function(value)
  {
    if (value && parentModel.node() !== false)
    {
      self.loadWeight();
    }
  });

  parentModel.node.subscribe(function(value)
  {
    if (self.show() && value !== false)
    {
      self.loadWeight();
    }
  });




  self.weightLoading = ko.observable(false);
  self.weightErrorText = ko.observable("");
  self.weight = ko.observableArray();

  self.loadWeight = function()
  {
    self.weight.removeAll();

    if (parentModel.node() && parentModel.node().type() === 'person')
    {
      var query = { };

      query._parents = { $in: [ parentModel.node()._id() ] };
      query.what = "measurment";
      query.type = "weight";

      self.weightErrorText("");
      self.weightLoading(true);

      murrix.server.emit("find", { query: query, options: "items" }, function(error, itemDataList)
      {
        self.weightLoading(false);

        if (error)
        {
          self.weightErrorText(error);
          return;
        }

        var itemList = [];

        for (var id in itemDataList)
        {
          itemList.push(murrix.cache.addItemData(itemDataList[id]));
        }

        self.weight(itemList);
      });
    }
  };

  self.addWeight = function(value, datestring)
  {
    var itemData = {};

    if (!datestring)
    {
      datestring = moment().format("YYYY-MM-DD HH:mm:ss Z");
    }

    itemData.name = "weight";
    itemData.type = "weight";
    itemData.what = "measurment";
    itemData.when = { timestamp: false, source: {} };
    itemData.when.source.datestring = datestring;
    itemData.when.source.type = "manual";
    itemData.when.source.comment = "";
    itemData.value = value;
    itemData.unit = "kg";

    itemData._parents = [ parentModel.node()._id() ];

    murrix.server.emit("saveItem", itemData, function(error, itemDataNew)
    {
      if (error)
      {
        console.log(error);
        return;
      }

      console.log("Saved item!", itemDataNew);
      murrix.cache.addItemData(itemDataNew);
      self.loadWeight();
    });
  };

  self.weight.subscribe(function(value)
  {
    if ($("#weight-container").length === 0)
    {
      return;
    }

    var data = [];
    var minTimestamp = false;
    var maxTimestamp = false;

    for (var n = 0; n < value.length; n++)
    {
      data.push({ date: new Date(value[n].when.timestamp() * 1000), value: value[n].value() });

      if (!minTimestamp || value[n].when.timestamp() < minTimestamp)
      {
        minTimestamp = value[n].when.timestamp();
      }

      if (!maxTimestamp || value[n].when.timestamp() > maxTimestamp)
      {
        maxTimestamp = value[n].when.timestamp();
      }
    }

    data = data.sort(function(a, b)
    {
      return a.date.getTime() - b.date.getTime();
    });

    var bzoom, dataChange, graph, h, line, mmData, redraw, setup, svg, update, w, x, xAxis, xPadding, y, yAxis, zoom;
    svg = null;
    graph = null;
    xPadding = 1;
    w = null;
    h = null;
    x = d3.time.scale();
    y = d3.scale.linear();

    mmData = d3.svg.area().x(function(d) {
      return x(d.date);
    }).y0(function(d) {
      return y(0);
    }).y1(function(d) {
      return y(d.value);
    }).defined(function(d) {
      return typeof d.value === 'number';
    });

    xAxis = d3.svg.axis().scale(x).orient('top');
    yAxis = d3.svg.axis().scale(y).orient('right').ticks(20);
    bzoom = d3.behavior.zoom();

    zoom = function() {
      return redraw();
    };

    setup = function() {
      graph.append('rect').attr('class', 'dragger').attr('fill', 'white').attr('width', w).attr('height', h).call(bzoom.x(x).on('zoom', zoom));
      graph.append('g').attr('class', 'yaxis').attr('transform', 'translate(0,0)');
      graph.append('g').attr('class', 'xaxis').attr('transform', 'translate(0,600)');

      graph.append("g").attr("class", "grid");

    };

    dataChange = function(data) {
      var linePath, mmPath;

      x.domain([new Date(minTimestamp * 1000), new Date(maxTimestamp * 1000)]);
      y.domain([d3.min(data, function(d) { return d.value; }) - 5, d3.max(data, function(d) { return d.value; }) + 5]);
      redraw();
      bzoom.x(x);

      mmPath = graph.selectAll('path.mm').data([data]);
      mmPath.enter().append('path').attr('class', 'mm time-dep');
      mmPath.attr('d', mmData);
    };

    redraw = function(data) {
      var node;
      node = svg.node().parentNode;
      w = $(node).width();
      h = 600;
      d3.select('.dragger').attr('width', w).attr('height', h);
      x.range([xPadding, w - 4 * xPadding]);
      y.range([h, 0]);
      d3.selectAll('path.mm').attr('d', mmData);

//       d3.select('g.yaxis').remove();
//       d3.select('g.xaxis').remove();
//       d3.select('rect.dragger').remove();
//
//       setup();

      d3.select('.xaxis').call(xAxis);
      d3.select('.yaxis').call(yAxis);
    };

    update = function(data) {

      updateScales(data);
      setupDragging(data);
      drawLines(data);
      return drawAxes(data);
    };

    svg = d3.select("#weight-container").append('svg').attr('class', 'graph-svg').attr('height', 600);
    graph = svg.append('g');
    setup();

    dataChange(data);

  });
};
