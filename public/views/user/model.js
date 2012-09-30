
var UserModel = function(parentModel, initialUserNodeId)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "user"; });


  self.currentUserNode = ko.observable(false);
  self.groupNodeList = ko.observableArray([]);
  self.inputUsername = ko.observable("");
  self.inputPassword = ko.observable("");
  self.inputRemember = ko.observable(false);
  self.usernameFocused = ko.observable(true);
  self.errorText = ko.observable("");
  self.loading = ko.observable(false);


  self.signOutClicked = function()
  {
    self.loading(true);
    self.errorText("");

    murrix.model.server.emit("logout", { }, function(error)
    {
      self.loading(false);

      if (error)
      {
        console.log("UserModel: Failed to logout!");
        self.errorText("Failed to sign out, try again");
        return;
      }

      $.cookie("userinfo", null, { path : "/" });

      $(".dropdown.open .dropdown-toggle").dropdown("toggle");
      self.currentUserNode(false);
    });
  };

  self.loginSubmit = function()
  {
    self.loading(true);
    self.errorText("");

    murrix.model.server.emit("login", { username: self.inputUsername(), password: self.inputPassword() }, function(error, userNode)
    {
      self.loading(false);
      
      if (error || userNode === false)
      {
        self.usernameFocused(true);
        console.log("UserModel: Failed to login!");
        self.errorText("Failed to sign in, try again");
        return;
      }

      if (self.inputRemember() === true)
      {
        $.cookie("userinfo", JSON.stringify({ username: self.inputUsername(), password: self.inputPassword() }), { expires: 365, path: '/' });
      }
      else
      {
        $.cookie("userinfo", null, { path: "/" });
      }

      self.inputUsername("");
      self.inputPassword("");
      self.inputRemember(false);

      $(".dropdown.open .dropdown-toggle").dropdown("toggle");
      
      self.currentUserNode(murrix.model.cacheNode(userNode));
    });
  };

  self.currentUserNode.subscribe(function(node)
  {
    self.groupNodeList.removeAll();

    if (node === false)
    {
      return;
    }

//     node.getLinkedNodes([ "admin", "all", "read" ], function(resultCode, nodeIdList, nodeList)
//     {
//       if (resultCode != MURRIX_RESULT_CODE_OK)
//       {
//         console.log("UserModel: Got error while trying to fetch required nodes, resultCode = " + resultCode);
//       }
//       else if (nodeList.length > 0)
//       {
//         self.groupNodeList(nodeList);
//       }
//       else
//       {
//         console.log("UserModel: No groups found.");
//       }
//     });
  });

  self.setInitialUser = function(node)
  {
    self.currentUserNode(node);

    // TODO: Is this cookie not sent to the server on all requests, perform server side login!
    if ($.cookie("userinfo") !== null)
    {
      console.log("UserModel: Signing in with cookie information");
      var data = JSON.parse($.cookie("userinfo"));

      self.inputUsername(data.username);
      self.inputPassword(data.password);
      self.inputRemember(true);

      self.loginSubmit();
    }
  }
};
