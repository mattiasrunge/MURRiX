
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

    self.checkDuplicateFiles();

  });


  self.doIssueAction = function(issue)
  {
    console.log(issue);
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

