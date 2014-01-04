
define(['knockout', 'murrix'], function(ko, murrix)
{
  return {
    activate: function(nodeId, itemId)
    {
      murrix.itemId(itemId ? itemId : false);
    }
  }
});
