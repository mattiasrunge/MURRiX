
var UserModel = function(parentModel, defaultNodeId)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "profile"; });


  self.defaultUsername = "anonymous";
  self.currentUserNodeId = ko.observable(defaultNodeId);
/*
  self.inputUsername = ko.observable("");
  self.inputPassword = ko.observable("");
  self.usernameFocused = ko.observable(true);
  self.statusText = ko.observable("");
  self.loading = ko.observable(false);

  self.signOutClicked = function()
  {
    self.loading(true);

    $.murrix.call("user", "Logout", { }, function(transaction_id, result_code, response_data, message)
    {
      self.loading(false);

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
      else
      {
        $('.notification').notify({
          message: {
            text: 'Sign out successfull!'
          }
        }).show();

        self.updateFromNode(response_data.Node);
      }
    });

    return false;
  };

  self.loginSubmit = function(form)
  {
    self.loading(true);
    self.statusText("");

    $.murrix.call("user", "Login", { "Username" : self.inputUsername(), "Password" : SHA1(self.inputPassword()) }, function(transaction_id, result_code, response_data, message)
    {
      self.loading(false);

      if (result_code != MURRIX_RESULT_CODE_OK)
      {
        self.usernameFocused(true);
        self.statusText(message);
      }
      else
      {
        $('.notification').notify({
          message: {
            text: 'Sign in successfull!'
          }
        }).show();

        self.updateFromNode(response_data.Node);
      }
    });
  };
*/
  self.currentUserNode = ko.computed(function()
  {
    console.log("UserModel: Current user id is now " + self.currentUserNodeId());

    if (!parentModel.dbModel.nodes[self.currentUserNodeId()])
    {
      console.log("UserModel: Index was -1, returning false as user node!");
      return false;
    }

    console.log("UserModel: User node is cached, returning!");
    return parentModel.dbModel.nodes[self.currentUserNodeId()];
  });

  self.currentUserEmail = ko.computed(function()
  {
    var node = self.currentUserNode();

    if (node === false)
    {
      return ko.observable("");
    }

    for (var n = 0; n < node.attributes().length; n++)
    {
      if (node.attributes()[n].name() === "Email")
      {
        return node.attributes()[n].value;
      }
    }

    return ko.observable("");
  });

  self.isAnonymous = ko.computed(function()
  {
    if (self.currentUserNode() === false)
    {
      return true;
    }

    for (var n = 0; n < self.currentUserNode().attributes().length; n++)
    {
      if (self.currentUserNode().attributes()[n].name() === "Username" && self.currentUserNode().attributes()[n].value !== self.defaultUsername)
      {
        return false;
      }
    }
    
    return true;
  });



  /* Get initial user information */
  parentModel.dbModel.fetchNodesBuffered([ self.currentUserNodeId() ], function(transactionId, resultCode)
  {
    if (resultCode != MURRIX_RESULT_CODE_OK)
    {
      console.log("UserModel: Got error while trying to fetch node, resultCode = " + resultCode)
    }
  });
};
