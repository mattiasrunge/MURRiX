
define(["plugins/router", "durandal/app", "ko-ext", "moment", "murrix", "jquery", "jquery-cookie"], function(router, app, ko, moment, murrix, $, cookie)
{
  var nodeId = ko.observable(false);

  nodeId.subscribe(function(value)
  {
    if (value)
    {
      if (value !== murrix.nodeId())
      {
        router.navigate("/node/" + value);
      }
    }
  });
  
  murrix.nodeId.subscribe(function(value)
  {
    nodeId(value);
  });

  return {
    user: murrix.user,
    userNode: murrix.userNode,
    router: router,
    loading: ko.observable(false),
    nodeId: nodeId,
    item: murrix.item,
    nodeIdRaw: ko.observable(false),
    randomNode: function()
    {
      murrix.server.emit("node.random", {}, function(error, nodeData)
      {
        if (error)
        {
          console.log("Could not get random node, error: " + error);
          router.navigateBack();
          return;
        }

        router.navigate("node/" + nodeData._id);
        return;
      });
    },
    activate: function()
    {
      router.map([
        { route: ["", "murrix*details"],                            moduleId: "root/murrix/index",          nav: true, hash: "#murrix" },
        { route: "node/:id*details",        title: "Node",          moduleId: "root/node/index",            nav: true, hash: "#node/:id" },
        { route: "signin",                  title: "Sign in",       moduleId: "root/signin/index",          nav: true },
      ]);

      router.mapUnknownRoutes("root/notfound/index", "");
      router.buildNavigationModel();

      return router.activate();
    },
    signout: function()
    {
      murrix.server.emit("user.logout", {}, function(error)
      {
        $.cookie("userinfo", null, { path: "/" });
        murrix.user(false);
      });
    }
  };
});
