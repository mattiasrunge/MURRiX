
var UserModel = function(parentModel, initialUserNodeId)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "user"; });


  self.currentUserNode = ko.observable(false);
  self.inputUsername = ko.observable("");
  self.inputPassword = ko.observable("");
  self.usernameFocused = ko.observable(true);
  self.errorText = ko.observable("");
  self.loading = ko.observable(true);

  self.signOutClicked = function()
  {
    self.loading(true);
    self.errorText("");

    $.murrix.call("user", "Logout", { }, function(transactionId, resultCode)
    {
      self.loading(false);

      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("UserModel: Got error while trying to fetch node, resultCode = " + resultCode);
        console.log("Failed to sign out, resultCode " + resultCode);
      }
      else
      {
        self.currentUserNode(false);
      }
    });

    return false;
  };

  self.loginSubmit = function(form)
  {
    self.loading(true);
    self.errorText("");

    $.murrix.call("user", "Login", { "Username" : self.inputUsername(), "Password" : self.inputPassword() }, function(transactionId, resultCode, response)
    {
      self.loading(false);

      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        self.usernameFocused(true);
        console.log("UserModel: Got error while trying to sign in, resultCode = " + resultCode);
        self.errorText("Failed to sign in, try again, resultCode" + resultCode);
      }
      else
      {
        self.inputUsername("");
        self.inputPassword("");
        self.currentUserNode(response.Node);
      }
    });
  };

  /* Get initial user information */
  $.murrix.module.db.fetchNodesBufferedIndexed([ initialUserNodeId ], function(transactionId, resultCode, nodeList)
  {
    self.loading(false);
    self.errorText("");

    if (resultCode != MURRIX_RESULT_CODE_OK)
    {
      console.log("UserModel: Got error while trying to fetch node, resultCode = " + resultCode);
      self.errorText("Error while fetching user information, resultCode " + resultCode);
    }
    else if (nodeList.length === 0 || nodeList[initialUserNodeId].attr("Username") === "anonymous")
    {
      console.log("UserModel: You are now anonymous!");
      self.currentUserNode(false);
    }
    else
    {
      self.currentUserNode(nodeList[initialUserNodeId]);
    }
  });
};
