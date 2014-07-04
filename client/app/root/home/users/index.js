
define(['durandal/app', 'plugins/router', 'knockout', 'murrix'], function(app, router, ko, murrix)
{
  var user = ko.observable(false);
  var list = ko.observableArray();
  var loading = ko.observable(false);
  var errorText = ko.observable("");
  var successText = ko.observable("");

  function loadList()
  {
    murrix.server.emit("user.find", { options: { sort: [ 'name' ] }}, function(error, userDataList)
    {
      if (error)
      {
        console.log(error);
        return;
      }

      list.removeAll();

      for (var key in userDataList)
      {
        list.push(userDataList[key]);
      }
    });
  }

  murrix.user.subscribe(function(value)
  {
    if (value === false)
    {
      list.removeAll();
    }
    else
    {
      loadList();
    }
  });

  user.subscribe(function(value)
  {
    if (value !== false)
    {
      loadList();
      router.navigate("/murrix/users/" + value._id);
    }
  });

  return {
    activate: function(id)
    {
      loadList();

      if (!id)
      {
        user(false);
        return;
      }

      murrix.server.emit("user.get", id, function(error, userData)
      {
        if (error)
        {
          console.log(error);
          return;
        }

        user(userData ? userData : false);
      });
    },
    deleteUser: function(data)
    {
      app.showMessage('Are you sure you want to delete ' + data.name + '?', 'Confirm action', ['Yes', 'No']).always(function(answer)
      {
        if (answer === "Yes")
        {
          murrix.server.emit("user.remove", data._id, function(error)
          {
            if (error)
            {
              console.log(error);
              return;
            }

            router.navigate("/murrix/users");
          });
        }
      });
    },
    user: user,
    list: list,
    loading: loading,
    errorText: errorText,
    successText: successText,
    canActivate: function()
    {
      if (murrix.user() === false)
      {
        return { redirect: "signin" };
      }
      
      return true;
    }
  }
});
