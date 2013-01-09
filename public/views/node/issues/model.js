
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
    }
  });


  self.doIssueAction = function(issue)
  {
    console.log(issue);
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

    var issue = {};
    issue.action = ko.observable("addBirthEvent");
    issue.actionTitle = ko.observable("Add birth event?");
    issue.title = ko.observable("No birth event found!");
    issue.description = ko.observable("This person has no birth event associated with it, everyone has a birth date, this should be added!");

    self.issues.push(issue);
  };

  self.checkEmptyAlbum = function()
  {
    if (parentModel.items().length > 0 || parentModel.node() === false || parentModel.node().type() !== "album")
    {
      return;
    }

    var issue = {};
    issue.action = ko.observable("removeEmptyAlbum");
    issue.actionTitle = ko.observable("Remove album?");
    issue.title = ko.observable("Empty album!");
    issue.description = ko.observable("No items found for this item, it should be removed or have something added to it!");

    self.issues.push(issue);
  };

  self.checkDuplicateFiles = function()
  {
    var checkedFiles = [];
    var foundFiles = {};

    var issue = {};
    issue.action = ko.observable("removeDuplicateItems");
    issue.actionTitle = ko.observable("Remove all duplicates?");
    issue.ids = ko.observableArray();
    issue.title = ko.observable("Duplicate files found!");
    issue.description = ko.observable("");

    for (var n = 0; n < parentModel.items().length; n++)
    {
      if (parentModel.items()[n].what() !== "file")
      {
        continue;
      }

      var checksum = parentModel.items()[n].name(); // parentModel.items()[n].checksum()

      if (murrix.inArray(checksum, checkedFiles))
      {
        issue.ids.push(parentModel.items()[n]._id());
      }
      else
      {
        checkedFiles.push(checksum);
        foundFiles[checksum] = parentModel.items()[n];
      }
    }

    if (issue.ids().length > 0)
    {
      issue.description(issue.ids().length + " files were found to be duplicates and should be removed!");

      self.issues.push(issue);
    }
  };
};

