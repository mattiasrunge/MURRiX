
define(['knockout', 'murrix'], function(ko, murrix)
{
  return {
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
