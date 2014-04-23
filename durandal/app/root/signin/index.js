
define(['plugins/router', 'knockout', 'murrix', 'jquery', 'jquery-cookie'], function(router, ko, murrix, $, cookie)
{
  var username = ko.observable("");
  var password = ko.observable("");
  var rememberMe = ko.observable("");
  var errorText = ko.observable(false);
  var loading = ko.observable(false);

  return {
    canActivate: function()
    {
      if (murrix.user() === false)
      {
        return true;
      }

      return { 'redirect': '/' };
    },
    username: username,
    password: password,
    rememberMe: rememberMe,
    errorText: errorText,
    loading: loading,
    submit: function(data)
    {
      username($("#signin_username").val());
      password($("#signin_password").val());
      
      if (username() === "" || password() === "")
      {
        errorText("Username and password must be entered!");
        return false;
      }

      errorText(false);
      loading(true);

      murrix.server.emit("user.login", {
        username: username(),
        password: password()
      }, function(error, userData)
      {
        loading(false);

        if (error)
        {
          errorText(error);
          return;
        }

        if (userData === false)
        {
          errorText("No such user found!");
          return;
        }


        if (rememberMe() === true)
        {
          $.cookie("userinfo", JSON.stringify({ username: username(), password: password() }), { expires: 365, path: '/' });
        }
        else
        {
          $.cookie("userinfo", null, { path: "/" });
        }


        murrix.user(userData);

        document.location.reload();
      });
      
      return false;
    }
  };
});
