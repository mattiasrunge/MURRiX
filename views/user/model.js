
var UserModel = function(parentModel, initialUserNodeId)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "user"; });


  self.currentUserNode = ko.observable(false);
  self.inputUsername = ko.observable("");
  self.inputPassword = ko.observable("");
  self.inputRemember = ko.observable(false);
  self.usernameFocused = ko.observable(true);
  self.errorText = ko.observable("");
  self.loading = ko.observable(true);

  self.profileClicked = function()
  {

  };
  
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
        $.cookie("userinfo", null, { path : "/" });
        
        self.currentUserNode(false);
      }
    });

    return false;
  };

  self.loginSubmit = function()
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
        if (self.inputRemember() === true)
        {
          $.cookie("userinfo", JSON.stringify({ username: self.inputUsername(), password : self.inputPassword() }), { expires: 365, path: '/' });
        }
        else
        {
          $.cookie("userinfo", null, { path : "/" });
        }
        
        self.inputUsername("");
        self.inputPassword("");
        self.inputRemember(false);
        
        self.currentUserNode(response.Node);
      }
    });
  };

  if ($.cookie("userinfo") !== null)
  {
    console.log("UserModel: Signing in with cookie information");
    var data = JSON.parse($.cookie("userinfo"));

    self.inputUsername(data.username);
    self.inputPassword(data.password);
    self.inputRemember(true);

    self.loginSubmit();
  }
  else
  {
    console.log("UserModel: Fetching initial user data");
  
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
  }
};
