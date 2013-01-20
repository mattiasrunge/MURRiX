
var TodoModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.items = ko.observableArray();

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "todo"))
    {
      self.show(value.action === "todo");
    }
  });

  var items = [
    {
      title: "Create a more complete about page for persons",
      description: "The about page for a person should contain: description, age, birth names, things the person owns, where the person lives, parents and children.",
      done: false
    },
    {
      title: "Create a more complete about page for locations",
      description: "The about page for a location should contain: description, who lives there, latitude, longitude, radius.",
      done: false
    },
    {
      title: "Create a more complete about page for cameras",
      description: "The about page for a camera should contain: description, owner, other information.",
      done: false
    },
    {
      title: "Create a more complete about page for vehicles",
      description: "The about page for a vehicle should contain: description, owner, other information.",
      done: false
    },
    {
      title: "Update edit/create dialog for locations",
      description: "When creating a location it should be possible to set the position and radius.",
      done: false
    },
    {
      title: "Naming conventions",
      description: "Define a set of naming conventions and create a issue function to verify that nodes follow it.",
      done: false
    },
    {
      title: "Display when a video is being conveted",
      description: "Videos needs to be converted to be viewable in a browser, this process takes a while and the video is not accessable until it is done. Right now no information about this is shown to the user, it just doesn't work. Some sort of warning or progress information should be displayed to tell the user that something is happening.",
      done: false
    },
    {
      title: "Instructions for uploading files",
      description: "It is very easy to upload files but it does not say anywhere how to do this, create a help text somewhare that describes this.",
      done: false
    },
    {
      title: "Describe how time is handled",
      description: "Time is a complex thing and is sometimes it can be difficult to understand what all MURRiX options are and mean. Write an instruction on how things work and why.",
      done: false
    },
    {
      title: "Search for location by position",
      description: "Items can be connected either directly to a location or have a position of it's own. If it has a position of it's own the location should be looked up by the position which is note done right now.",
      done: false
    },
    {
      title: "Download original file",
      description: "Sometimes one might want to extract a file from the system to use in some other way. A link should be added to download the source file, the file displayed in the browser is a generated file from the original and might have lesser quality. It might also be interesting to download a file with updated EXIF data.",
      done: false
    },
    {
      title: "Show tracks on map",
      description: "A vacation might store a complete track of the trip. This should be displayed on the background map. There should also be an inteface to connect vehicles and other stuff which have tracks.",
      done: false
    },
    {
      title: "Improve speed of large nodes",
      description: "Some nodes have a very many items connected to them and this makes it slow to look at them. Some sort of delayed loading or pagination needs to be implemented.",
      done: false
    },
    {
      title: "Rotate videos",
      description: "The interface supports setting an angle (rotating) a video file. But that setting is not yet used. Implement rotation of video files.",
      done: false
    }
  ];

  self.items(items);
};
