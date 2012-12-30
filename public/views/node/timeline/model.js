
var TimelineModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.visible = ko.observable(false);
  self.show = ko.observable(true);
  self.showButton = ko.observable(true);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "" && self.visible()))
    {
      self.show(value.action === "" && self.visible());
    }

    if (self.showButton() !== (value.action === ""))
    {
      self.showButton(value.action === "");
    }
  });

  self.visible.subscribe(function(value)
  {
    if (self.show() !== (parentModel.path().primary().action === "" && self.visible()))
    {
      self.show(parentModel.path().primary().action === "" && self.visible());
    }
  });
/*
  self.show.subscribe(function(value)
  {
    if (value)
    {
      setTimeout(function()
      {
        self.timeline.redraw();
        self.timeline.setVisibleChartRangeAuto();
      }, 500);
    }
  });*/

  /*self.dataList = [];
  self.timeline = new links.Timeline($(".background-timeline-content").get(0));

  parentModel.items.subscribe(function(value)
  {
    self.dataList = [];

    for (var n = 0; n < value.length; n++)
    {
      if (typeof value[n].when === "object")
      {
        var dataItem = {};
        dataItem.start = new Date(value[n].when.timestamp() * 1000);
        dataItem.content = value[n].name();
        //dataItem.end;

        self.dataList.push(dataItem);
      }
    }

    self.timeline.draw(self.dataList, {
      width:    '100%',
      height:   'auto',
      editable: true,   // enable dragging and editing events
      style:    'box'
    });

    self.timeline.setVisibleChartRangeAuto();


  });




//
//
//
//   links.events.addListener(self.timeline, 'rangechanged', function(properties)
//   {
//     console.log('rangechanged ' + properties.start + ' - ' + properties.end);
//   });
//
//   // Draw our timeline with the created data and options
  self.timeline.draw(self.dataList, {
    width:    '100%',
    height:   'auto',
    editable: true,   // enable dragging and editing events
    style:    'box'
  });

  self.toggleTimeline = function()
  {
    self.visible(!self.visible());
  };*/
};


