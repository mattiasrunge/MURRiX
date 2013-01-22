
var SearchModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "search"))
    {
      self.show(value.action === "search");
    }
  });

  self.show.subscribe(function(value)
  {
    if (value)
    {
      parentModel.title("MURRiX - Search");
    }
  });

  self.searchTypeAlbum = ko.observable(true);
  self.searchTypePerson = ko.observable(true);
  self.searchTypeLocation = ko.observable(true);
  self.searchTypeCamera = ko.observable(true);
  self.searchTypeVehicle = ko.observable(true);

  self.query = ko.observable("");
  self.findQuery = false;

  self.queryInput = ko.observable("");
  self.results = ko.observableArray([ ]);
  self.pages = ko.observableArray([ ]);
  self.currentPage = ko.observable(0);

  self.itemsPerPage = 30;
  self.resultCount = ko.observable(0);
  self.loading = ko.observable(false);
  self.errorText = ko.observable("");

  /* This function is run when the primary path is changed
   * and a new node id has been set. It tries to cache
   * the node and set the primary node id observable.
   */
  parentModel.path().primary.subscribe(function(primary)
  {
    if (primary.action !== "search")
    {
      return;
    }

    if (primary.args.length === 0)
    {
      console.log("No query specified!");
      return;
    }

    var query = primary.args[0];
    console.log("Got query = " + query);


    /* If the page has been updated, update query to refresh database search */
    if (primary.args.length > 1)
    {
      var currentPage = murrix.intval(primary.args[1]);

      if (currentPage !== self.currentPage())
      {
        console.log("Current page has changed to " + currentPage + " and query is \"" + query + "\"");
        self.currentPage(currentPage);

        if (query === self.query())
        {
          self.showResults();
        }
      }
    }
    else
    {
      self.currentPage(0);
    }

    self.queryInput(query);

    if (query !== self.query())
    {
      console.log("Query has changed to \"" + query + "\"");
      self.query(query);
      self.queryInput(query);

      murrix.cache.clearNodes();

      self.runQuery();
    }
  });

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
    if (self.currentPage() - 1 >= 0)
    {
      self.pageClicked(self.currentPage() - 1);
    }

    return false;
  };

  self.nextPageClicked = function()
  {
    if (self.currentPage() + 1 < self.pages().length)
    {
      self.pageClicked(self.currentPage() + 1);
    }

    return false;
  };

  self.showResults = function()
  {
    var skip = self.itemsPerPage * self.currentPage();

    self.results.removeAll();
    self.errorText("");

    if (self.resultCount() > 0)
    {
      self.loading(true);

      murrix.server.emit("find", { query: self.findQuery, options: { collection: "nodes", limit: self.itemsPerPage, skip: skip } }, function(error, nodeDataList)
      {
        self.loading(false);

        if (error)
        {
          self.errorText(error);
          console.log(error);
          return;
        }

        var resultList = [];

        for (var key in nodeDataList)
        {
          resultList.push(murrix.cache.addNodeData(nodeDataList[key]));
        }

        self.results(resultList);
      });
    }
  };

  parentModel.currentUser.subscribe(function(value)
  {
    self.runQuery();
  });

  self.searchTypeAlbumClicked = function()
  {
    self.searchTypeAlbum(!self.searchTypeAlbum());
    self.runQuery();
  };

  self.searchTypePersonClicked = function()
  {
    self.searchTypePerson(!self.searchTypePerson());
    self.runQuery();
  };

  self.searchTypeLocationClicked = function()
  {
    self.searchTypeLocation(!self.searchTypeLocation());
    self.runQuery();
  };

  self.searchTypeCameraClicked = function()
  {
    self.searchTypeCamera(!self.searchTypeCamera());
    self.runQuery();
  };

  self.searchTypeVehicleClicked = function()
  {
    self.searchTypeVehicle(!self.searchTypeVehicle());
    self.runQuery();
  };


  self.runQuery = function()
  {
    self.results.removeAll();
    self.pages.removeAll();
    self.resultCount(0);
    self.findQuery = false;
    self.errorText("");

    if (self.query() !== "")
    {
      var parts = self.query().split("=");

      var action = "name";
      var query = "";

      if (parts.length === 1)
      {
        query = self.query();
      }
      else
      {
        action = parts[0];
        query = parts[1];
      }

      if (action === "tag")
      {
        self.findQuery = { tags: query };
      }
      else //(action === name)
      {
        self.findQuery = { name: { $regex: ".*" + query + ".*", $options: "-i" } };
      }

      var types = [];

      if (self.searchTypeAlbum())
      {
        types.push("album");
      }

      if (self.searchTypePerson())
      {
        types.push("person");
      }

      if (self.searchTypeLocation())
      {
        types.push("location");
      }

      if (self.searchTypeCamera())
      {
        types.push("camera");
      }

      if (self.searchTypeVehicle())
      {
        types.push("vechicle");
      }

      self.findQuery.type = { $in: types };

      if (types.length === 0)
      {
        self.showResults();
        return;
      }

      self.loading(true);

      murrix.server.emit("count", { query: self.findQuery, options: "nodes" }, function(error, count)
      {
        self.loading(false);

        if (error)
        {
          self.errorText(error);
          console.log(error);
          return;
        }

        var pages = Math.ceil(count / self.itemsPerPage);

        for (var n = 0; n < pages; n++)
        {
          self.pages.push(n);
        }

        self.resultCount(count);

        self.showResults();
      });
    }
  };

  self.searchTypeaheadUpdater = function(key)
  {
    document.location.hash = "#node:" + key;
  };

};
