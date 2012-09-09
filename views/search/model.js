
var SearchModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "search"; });

  self.query = ko.observable("");

  self.queryInput = ko.observable("");
  self.results = ko.observableArray([ ]);
  self.pages = ko.observableArray([ ]);
  self.currentPage = ko.observable(0);

  self.itemsPerPage = 25;
  self.resultIds = ko.observableArray([ ]);

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

    console.log(primary);
    if (primary.args.length == 0)
    {
      console.log("No query specified!");
      return;
    }

    var query = primary.args[0];
    console.log("Got query = " + query);


    /* If the page has been updated, update query to refresh database search */
    if (primary.args.length > 1)
    {
      var currentPage = primary.args[1];

      if (typeof currentPage != "number")
      {
        try
        {
          currentPage = parseInt(currentPage, 10);
        }
        catch (e)
        {
          currentPage = 0;
        }
      }

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
    var offset = self.itemsPerPage * self.currentPage();

    var id_list = self.resultIds.slice(offset, offset + self.itemsPerPage);

    self.results.removeAll();

    if (id_list.length > 0)
    {
      $.murrix.module.db.fetchNodesBuffered(id_list, function(transaction_id, result_code, node_list, message)
      {
        if (result_code != MURRIX_RESULT_CODE_OK)
        {
          $('.notification').notify({
            message: {
              text: message
            },
            type: 'error',
            fadeOut: {
              enabled: false
            }
          }).show();
        }
        else if (node_list.length === 0)
        {
          $('.notification').notify({
            message: {
              text: 'No nodes found but search returned something, this is inconsitent!'
            },
            type: 'error',
            fadeOut: {
              enabled: false
            }
          }).show();
        }
        else
        {
          jQuery.each(node_list, function(id, node)
          {
            self.results.push({
              id: node.id,
              name: node.name
            });
          });
        }
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
    self.resultIds.removeAll();

    if (self.query() !== "")
    {
      $.murrix.module.db.searchNodeIds({ string: self.query() }, function(transactionId, resultCode, nodeIdList)
      {
        if (resultCode != MURRIX_RESULT_CODE_OK)
        {
          console.log("Got error while trying to run query, resultCode = " + resultCode);
        }
        else
        {
          var length = 0;

          jQuery.each(nodeIdList, function(n, nodeId)
          {
            self.resultIds.push(nodeId);
            length++;
          });

          var pages = Math.ceil(length / self.itemsPerPage);

          for (var n = 0; n < pages; n++)
          {
            self.pages.push(n);
          }

          self.showResults();
        }
      });
    }
  };

};
