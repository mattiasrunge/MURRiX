
define(['plugins/router', 'durandal/app', 'knockout', 'moment', 'murrix'], function(router, app, ko, moment, murrix)
{
  ko.bindingHandlers.datetimeLocal = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();
      var rawValue = ko.utils.unwrapObservable(value);

      if (!rawValue)
      {
        $(element).text("an unknown date and time");
        return;
      }

      var dateItem = moment.utc(rawValue * 1000).local();

      if (!dateItem.date())
      {
        $(element).html(rawValue);
      }
      else
      {
        $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
      }
    }
  };

  ko.bindingHandlers.datetimeAgo = {
    update: function(element, valueAccessor)
    {
      var value = valueAccessor();

      var rawValue = ko.utils.unwrapObservable(value);
      var dateItem = null;

      if (typeof rawValue === "number")
      {
        dateItem = moment.unix(rawValue);
      }
      else if (typeof rawValue === "string")
      {
        dateItem = moment(rawValue + "+0000", "YYYY-MM-DD HH:mm:ss Z");
      }
      else
      {
        $(element).html("never");
        return;
      }

      if (!dateItem.date())
      {
        $(element).html(ko.utils.unwrapObservable(rawValue));
      }
      else
      {
        $(element).html(dateItem.fromNow());
      }
    }
  };

  var nodeId = ko.observable(false);
  var nodeIdRaw = ko.observable("");

  function loadNode(id)
  {
    if (id === "" || id === false)
    {
      router.navigate("/");
      return;
    }

    router.navigate("/node/" + id);
  }

  nodeId.subscribe(function(value)
  {
    loadNode(value);
  });

  function nodeSubmit()
  {
    console.log("nodeSubmit", nodeIdRaw());
    loadNode(nodeIdRaw());
  }

  return {
    user: murrix.user,
    router: router,
    loading: ko.observable(false),
    nodeId: nodeId,
    nodeIdRaw: nodeIdRaw,
    nodeSubmit: nodeSubmit,
    activate: function()
    {
      router.map([
        { route: ['', 'murrix*details'],                            moduleId: 'root/murrix/index',          nav: true, hash: '#murrix' },
        { route: 'admin/group',             title: 'Groups',        moduleId: 'root/admin/group/index',     nav: true },
        { route: 'admin/group/create',      title: 'Create group',  moduleId: 'root/admin/group/create',    nav: true },
        { route: 'admin/group/:id/show',    title: 'Show group',    moduleId: 'root/admin/group/show',      nav: true },
        { route: 'admin/group/:id/update',  title: 'Update group',  moduleId: 'root/admin/group/update',    nav: true },
        { route: 'admin/group/:id/delete',  title: 'Delete group',  moduleId: 'root/admin/group/delete',    nav: true },
        { route: 'signin',                  title: 'Sign in',       moduleId: 'root/signin/index',          nav: true },
      ]);

      /*
        /Product  GET Hämtar en lista med alla produkter
        /Product  POST  Skapar en ny produkt
        /Product/{ProductID}  GET Returnerar en produkt
        /Product/{ProductID}  PUT Uppdaterar en produkt
        /Product/{ProductID}  DELETE  Tar bort en produkt
        /ProductGroup/{ProductGroupID}  GET Returnerar en produktgrupp
      */

      /*
       * #admin/group/index
       * #admin/group/create
       * #admin/group/:id/show
       * #admin/group/:id/update
       * #admin/group/:id/delete
       *
       * #admin/user/index
       * #admin/user/create
       * #admin/user/:id/show
       * #admin/user/:id/update
       * #admin/user/:id/delete
       *
       * #system/login
       * #system/logout
       *
       * #node/index
       * #node/create
       * #node/:id/update
       * #node/:id/delete
       * #node/:id/show
       * #node/:id/show/timeline
       * #node/:id/show/files
       * #node/:id/show/map
       * #node/:id/show/tools
       * #node/:id/show/relations
       * #node/:id/show/comments
       *
       * #node/:id/item/create
       * #node/:id/item/:id/update
       * #node/:id/item/:id/delete
       * #node/:id/item/:id/show
       * #node/:id/item/:id/update/when
       * #node/:id/item/:id/update/where
       * #node/:id/item/:id/update/with
       * #node/:id/item/:id/update/who
       * #node/:id/item/:id/update/tags
       *
       */


      router.mapUnknownRoutes('root/notfound/index', '');

      router.buildNavigationModel();

      return router.activate();
    },
    signout: function()
    {
      murrix.server.emit("user.logout", {}, function(error)
      {
        murrix.user(false);
      });
    }
  };
});
