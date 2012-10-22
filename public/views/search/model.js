
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
  self.findQuery = false;

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

    self.queryInput(query);

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
      murrix.server.emit("find", { query: self.findQuery, options: { collection: "nodes", limit: self.itemsPerPage, skip: skip } }, function(error, nodeDataList)
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

  parentModel.currentUser.subscribe(function(value)
  {
    self.runQuery();
  });

  self.runQuery = function()
  {
    self.results.removeAll();
    self.pages.removeAll();
    self.resultCount(0);
    self.findQuery = false;

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
    
      murrix.server.emit("count", { query: self.findQuery, options: "nodes" }, function(error, count)
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

  $(".navbar-search-input").typesearch({
    limit: 10,
    source: function(query, callback)
    {
      murrix.server.emit("find", { query: { name: { $regex: ".*" + query + ".*", $options: "-i" } }, options: { collection: "nodes", limit: 10 } }, function(error, nodeDataList)
      {
        if (error)
        {
          console.log(error);
          callback([]);
        }

        var resultList = [];

        for (var key in nodeDataList)
        {
          var imgUrl = "http://placekitten.com/g/32/32";

          if (nodeDataList[key]._profilePicture)
          {
            imgUrl = "/preview?id=" + nodeDataList[key]._profilePicture + "&width=32&height=32&square=1";
          }
        
          var item = {};
          item.name = nodeDataList[key].name;
          item.key = nodeDataList[key]._id;
          item.html = "<li ><a href='#'><img src='" + imgUrl + "'><span class='typesearch-name' style='margin-left: 20px'></span></a></li>";
        
          resultList.push(item);
        }

        callback(resultList);
      });
    },
    selectFn: function(key)
    {
      document.location.hash = "#node:" + key;
    }
  });
  
};
