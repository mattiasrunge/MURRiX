
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

  
  self.query = ko.observable("");

  self.queryInput = ko.observable("");
  self.results = ko.observableArray([ ]);
  self.pages = ko.observableArray([ ]);
  self.currentPage = ko.observable(0);

  self.itemsPerPage = 25;
  self.resultCount = ko.observable(0);

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

    if (query !== self.query())
    {
      console.log("Query has changed to \"" + query + "\"");
      self.query(query);
      self.queryInput(query);

      self.runQuery();
    }
  });

  self.searchSubmit = function(form)
  {
    document.location.hash = "#search:" + self.queryInput();
  };


  self.pageClicked = function(page)
  {
    console.log(page);
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

    if (self.resultCount() > 0)
    {
      murrix.server.emit("find", { query: { name: { $regex: ".*" + self.query() + ".*", $options: "-i" } }, options: { collection: "nodes", limit: self.itemsPerPage, skip: skip } }, function(error, nodeDataList)
      {
        if (error)
        {
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
/*
  parentViewModel.currentSubview.subscribe(function(newValue)
  {
    if (newValue === "")
    {
      newValue = 0;
    }
  
    self.currentPage(parseInt(newValue, 10));
    self.showResults();
  });
*/

  self.runQuery = function()
  {
    self.results.removeAll();
    self.pages.removeAll();
    self.resultCount(0);

    if (self.query() !== "")
    {
      murrix.server.emit("count", { query: { name: { $regex: ".*" + self.query() + ".*", $options: "-i" } }, options: "nodes" }, function(error, count)
      {
        if (error)
        {
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

};
