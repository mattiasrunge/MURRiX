
var TimelineModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "timeline"; });
  self.enabled = ko.observable(true);



  // Create a JSON data table
  var data = [
    {
      'start': new Date(2010,7,23),
      'content': 'Conversation<br><img src="img/comments-icon.png" style="width:32px; height:32px;">'
    },
    {
      'start': new Date(2010,7,23,23,0,0),
      'content': 'Mail from boss<br><img src="img/mail-icon.png" style="width:32px; height:32px;">'
    },
    {
      'start': new Date(2010,7,24,16,0,0),
      'content': 'Report'
    },
    {
      'start': new Date(2010,7,26),
      'end': new Date(2010,8,2),
      'content': 'Traject A'
    },
    {
      'start': new Date(2010,7,28),
      'content': 'Memo<br><img src="img/notes-edit-icon.png" style="width:48px; height:48px;">'
    },
    {
      'start': new Date(2010,7,29),
      'content': 'Phone call<br><img src="img/Hardware-Mobile-Phone-icon.png" style="width:32px; height:32px;">'
    },
    {
      'start': new Date(2010,7,31),
      'end': new Date(2010,8,3),
      'content': 'Traject B'
    },
    {
      'start': new Date(2010,8,4,12,0,0),
      'content': 'Report<br><img src="img/attachment-icon.png" style="width:32px; height:32px;">'
    }
  ];

  // specify options
  var options = {
    width:    '100%',
    height:   'auto',
    editable: true,   // enable dragging and editing events
    style:    'box'
  };


//   self.timeline = new links.Timeline($("#timeline").get(0));
// 
// 
// 
//   links.events.addListener(self.timeline, 'rangechanged', function(properties)
//   {
//     console.log('rangechanged ' + properties.start + ' - ' + properties.end);
//   });
// 
//   // Draw our timeline with the created data and options
//   self.timeline.draw(data, options);
};

 
