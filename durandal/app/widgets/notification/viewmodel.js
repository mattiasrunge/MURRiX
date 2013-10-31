
define(['durandal/composition', 'knockout', 'jquery'], function(composition, ko, $)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;
    var removing = false;

    self.messages = ko.observableArray();


    settings.error.subscribe(function(value)
    {
      if (removing)
      {
        return;
      }

      var list = [];

      for (var n = 0; n < self.messages().length; n++)
      {
        if (self.messages()[n].status !== 'error')
        {
          list.push(self.messages()[n]);
        }
      }

      self.messages(list);

      if (value)
      {
        self.messages.push({ status: 'error', text: value });
      }
    });

    settings.success.subscribe(function(value)
    {
      if (removing)
      {
        return;
      }

      if (value)
      {
        self.messages.push({ status: 'success', text: value });
      }
    });

    self.afterRenderItem = function(elements, item)
    {
      var parts = composition.getParts(elements);
      var $alert = $(parts.alert);

      $alert.alert();

      $alert.on('closed.bs.alert', function()
      {
        removing = true;

        if (item.status === 'error')
        {
          settings.error(false);
        }
        else if (item.status === 'success')
        {
          settings.success(false);

          if (item.timer)
          {
            clearTimeout(item.timer);
          }
        }

        self.messages.remove(item);

        removing = false;
      });

      if (item.status === 'success')
      {
        item.timer = setTimeout(function()
        {
          $alert.alert('close');
        }, 10000);
      }
    };
  };

  return ctor;
});
