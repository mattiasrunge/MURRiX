
var SearchModel = function(parentModel)
{
  var self = this;

  BaseModel(self, parentModel, { action: "search", title: "Search by name" });
  BaseDataModel(self, parentModel, ko.observableArray());

  self.searchTypeAlbum = ko.observable(true);
  self.searchTypePerson = ko.observable(true);
  self.searchTypeLocation = ko.observable(true);
  self.searchTypeCamera = ko.observable(true);
  self.searchTypeVehicle = ko.observable(true);

  self.queryInput = ko.observable("");
  self.query = ko.observable("");
  self.page = ko.observable(0);
  self.limit = ko.observable(30);
  self.pages = ko.observableArray([]);
  self.count = ko.observable(0);

  self.args.subscribe(function(value)
  {
    var query = value.length > 0 ? value[0] : "";
    var page = value.length > 1 ? parseInt(value[1], 10) : 0;

    if (query !== self.query() || page !== self.page())
    {
      self.query(query);
      self.queryInput(query);
      self.page(page);
      self.loaded(false);
    }
  });

  self.reset = function()
  {
    self.pages.removeAll();
    self.count(0);
  };

  self.load = function(callback)
  {
    self.reset();

    if (self.query() !== "")
    {
      var args = {};

      args.query = self.query();
      args.page = self.page();
      args.limit = self.limit();
      args.types = [];

      if (self.searchTypeAlbum())
      {
        args.types.push("album");
      }

      if (self.searchTypePerson())
      {
        args.types.push("person");
      }

      if (self.searchTypeLocation())
      {
        args.types.push("location");
      }

      if (self.searchTypeCamera())
      {
        args.types.push("camera");
      }

      if (self.searchTypeVehicle())
      {
        args.types.push("vechicle");
      }

      murrix.server.emit("helper_nodeSearch", args, function(error, data)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var pages = Math.ceil(data.count / args.limit);

        for (var n = 0; n < pages; n++)
        {
          self.pages.push(n);
        }

        var nodeList = [];

        for (var key in data.nodeDataList)
        {
          nodeList.push(murrix.cache.addNodeData(data.nodeDataList[key]));
        }

        self.count(data.count);

        callback(null, nodeList);
      });
    }
    else
    {
      callback(null, []);
    }
  };

  self.searchSubmit = function(form)
  {
    document.location.hash = "#search:" + self.queryInput();
  };

  self.pageClicked = function(page)
  {
    document.location.hash = "#search:" + self.queryInput() + ":" + page;
    return false;
  };

  self.previousPageClicked = function()
  {
    if (self.page() - 1 >= 0)
    {
      self.pageClicked(self.page() - 1);
    }

    return false;
  };

  self.nextPageClicked = function()
  {
    if (self.page() + 1 < self.pages().length)
    {
      self.pageClicked(self.page() + 1);
    }

    return false;
  };

  parentModel.currentUser.subscribe(function(value)
  {
    self.resetInternal();
    self.show.valueHasMutated();
  });

  self.searchTypeAlbumClicked = function()
  {
    self.searchTypeAlbum(!self.searchTypeAlbum());
    self.resetInternal();
    self.show.valueHasMutated();
  };

  self.searchTypePersonClicked = function()
  {
    self.searchTypePerson(!self.searchTypePerson());
    self.resetInternal();
    self.show.valueHasMutated();
  };

  self.searchTypeLocationClicked = function()
  {
    self.searchTypeLocation(!self.searchTypeLocation());
    self.resetInternal();
    self.show.valueHasMutated();
  };

  self.searchTypeCameraClicked = function()
  {
    self.searchTypeCamera(!self.searchTypeCamera());
    self.resetInternal();
    self.show.valueHasMutated();
  };

  self.searchTypeVehicleClicked = function()
  {
    self.searchTypeVehicle(!self.searchTypeVehicle());
    self.resetInternal();
    self.show.valueHasMutated();
  };

  self.searchTypeaheadUpdater = function(key)
  {
    document.location.hash = "#node:" + key;
  };

};
