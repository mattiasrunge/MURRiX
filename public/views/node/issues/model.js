
var IssuesModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);
  self.issues = ko.observableArray();

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "issues"))
    {
      self.show(value.action === "issues");
    }
  });

  self.enabled = ko.computed(function()
  {
    return self.issues().length > 0;
  });

  parentModel.items.subscribe(function(value)
  {
    self.issues.removeAll();

    if (!parentModel.itemsLoading())
    {
      self.checkDuplicateFiles();
      self.checkEmptyAlbum();
      self.checkIfPersonHasBirth();
      self.checkAccesses();
    }
  });


  self.checkAccesses = function()
  {
    if (parentModel.node() === false || parentModel.node()._readers().length > 0 || parentModel.node()._admins().length > 0)
    {
      return;
    }

    var issue = {};

    issue.title = ko.observable("No groups with access found!");
    issue.description = ko.observable("This node is readable to you only since you are the administrator or the creator of the node, do not forget to give access to the wanted groups.");
    issue.actionTitle = ko.observable("Give a group access?");
    issue.action = function()
    {
      $("#editAccessModal").modal('show');
    };

    self.issues.push(issue);
  };

  self.checkIfPersonHasBirth = function()
  {
    var found = false;

    if (parentModel.node() === false || parentModel.node().type() !== "person")
    {
      return;
    }

    for (var n = 0; n < parentModel.items().length; n++)
    {
      if (parentModel.items()[n].what() === "text" && parentModel.items()[n].type && parentModel.items()[n].type() === "birth")
      {
        found = true;
        break;
      }
    }

    if (!found)
    {
      var issue = {};

      issue.title = ko.observable("No birth event found!");
      issue.description = ko.observable("This person has no birth event associated with it, everyone has a birth date, this should be added!");
      issue.actionTitle = ko.observable("Add birth event?");
      issue.action = function()
      {
        murrix.model.nodeModel.timelineModel.textItemEditOpenType("birth");
      };

      self.issues.push(issue);
    }
  };

  self.checkEmptyAlbum = function()
  {
    if (parentModel.items().length > 0 || parentModel.node() === false || parentModel.node().type() !== "album")
    {
      return;
    }

    var issue = {};

    issue.title = ko.observable("Empty album!");
    issue.description = ko.observable("No items found for this item, it should be removed or have something added to it!");
    issue.actionTitle = ko.observable("Remove album?");
    issue.action = function()
    {
      // TODO:
    };

    self.issues.push(issue);
  };

  self.checkDuplicateFiles = function()
  {
    var checkedFiles = [];
    var foundFiles = {};
    var ids = [];

    for (var n = 0; n < parentModel.items().length; n++)
    {
      if (parentModel.items()[n].what() !== "file")
      {
        continue;
      }

      var checksum = parentModel.items()[n].name(); // parentModel.items()[n].checksum()

      if (murrix.inArray(checksum, checkedFiles))
      {
        ids.push(parentModel.items()[n]._id());
      }
      else
      {
        checkedFiles.push(checksum);
        foundFiles[checksum] = parentModel.items()[n];
      }
    }

    if (ids.length > 0)
    {
      var issue = {};

      issue.title = ko.observable("Duplicate files found!");
      issue.description = ko.observable(ids.length + " files were found to be duplicates and should be removed!");
      issue.actionTitle = ko.observable("Remove all duplicates?");
      issue.action = function()
      {
        // TODO:
      };

      self.issues.push(issue);
    }
  };
};

