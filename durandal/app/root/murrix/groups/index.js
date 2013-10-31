
define(['durandal/app', 'plugins/router', 'knockout', 'murrix'], function(app, router, ko, murrix)
{
  var group = ko.observable(false);
  var list = ko.observableArray();
  var loading = ko.observable(false);
  var errorText = ko.observable("");
  var successText = ko.observable("");

  function loadList()
  {
    murrix.server.emit("group.find", { options: { sort: [ 'name' ] }}, function(error, userDataList)
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

  group.subscribe(function(value)
  {
    if (value !== false)
    {
      loadList();
      router.navigate("/murrix/groups/" + value._id);
    }
  });

  return {
    activate: function(id)
    {
      loadList();

      if (!id)
      {
        group(false);
        return;
      }

      murrix.server.emit("group.get", id, function(error, groupData)
      {
        if (error)
        {
          console.log(error);
          return;
        }

        group(groupData ? groupData : false);
      });
    },
    deleteUser: function(data)
    {
      app.showMessage('Are you sure you want to delete ' + data.name + '?', 'Confirm action', ['Yes', 'No']).always(function(answer)
      {
        if (answer === "Yes")
        {
          murrix.server.emit("group.remove", data._id, function(error)
          {
            if (error)
            {
              console.log(error);
              return;
            }

            router.navigate("/murrix/groups");
          });
        }
      });
    },
    group: group,
    list: list,
    loading: loading,
    errorText: errorText,
    successText: successText
  }
});
