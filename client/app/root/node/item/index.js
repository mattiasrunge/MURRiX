
define(['plugins/router', 'knockout'], function(router, ko)
{
  var childRouter = router.createChildRouter();


  return {
    router: childRouter,
    activate: function(id1, id2)
    {
      console.log(id1, id2);

      childRouter
      .reset()
      .makeRelative({
        moduleId: 'root/node',
        fromParent: true
      })
      .map([
        { route: [id, id + '/overview'],   moduleId: 'index',    title: 'Overview',   nav: true, hash: '#node/' + id + '/overview' },
        { route: id + '/timeline',         moduleId: 'timeline/index',    title: 'Timeline',   nav: true, hash: '#node/' + id + '/timeline' },
        { route: id + '/files',            moduleId: 'files/index',       title: 'Files',      nav: true, hash: '#node/' + id + '/files' },
        { route: id + '/map',              moduleId: 'map/index',         title: 'Map',        nav: true, hash: '#node/' + id + '/map' },
        { route: id + '/relations',        moduleId: 'relations/index',   title: 'Relations',  nav: true, hash: '#node/' + id + '/relations' },
        { route: id + '/comments',         moduleId: 'comments/index',    title: 'Comments',   nav: true, hash: '#node/' + id + '/comments' },
        { route: id + '/tools',            moduleId: 'tools/index',       title: 'Tools',      nav: true, hash: '#node/' + id + '/tools' },
        { route: id + '/item',             moduleId: 'item/index',        title: 'Items',      nav: true, hash: '#node/' + id + '/item' }
      ])
      .mapUnknownRoutes(function(instruction)
      {
        console.log("unknown", instruction);
      })
      .buildNavigationModel();
    }
  };
});
