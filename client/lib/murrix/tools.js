
define(["jquery"], function($)
{
  var $window = null;
  var $ownWindow = $({});
  
  function debounceEvent(event, element, triggerObject)
  {
    var triggered = false;
    var interval = false;
    var timer = 0;
    
    element.on(event, function()
    {
      triggered = true;
      
      if (!interval)
      {
        interval = setInterval(function()
        {
          if (triggered)
          {
            triggered = false;
            
            triggerObject.trigger(event); // Trigger process event
            
            clearTimeout(timer);
            
            timer = setTimeout(function()
            {
              clearInterval(interval);
              interval = false;
              
              triggerObject.trigger(event + ":complete"); // Trigger complete event
            }, 500);
          }
        }, 100);
      }
    });
  }
  
  $(function()
  {
    $window = $(window);
    
    debounceEvent("scroll", $window, $ownWindow);
    debounceEvent("resize", $window, $ownWindow);
    
    $ownWindow.enterFullscreen = function()
    {
      if (document.documentElement.requestFullscreen)
      {
        document.documentElement.requestFullscreen();
      }
      else if (document.documentElement.mozRequestFullScreen)
      {
        document.documentElement.mozRequestFullScreen();
      }
      else if (document.documentElement.webkitRequestFullscreen)
      {
        document.documentElement.webkitRequestFullscreen();
      }
      else if (document.documentElement.msRequestFullscreen)
      {
        document.documentElement.msRequestFullscreen();
      }
    };
  
    $ownWindow.exitFullscreen = function()
    {
      if (document.exitFullscreen)
      {
        document.exitFullscreen();
      }
      else if (document.mozExitFullScreen)
      {
        document.mozExitFullScreen();
      }
      else if (document.webkitExitFullscreen)
      {
        document.webkitExitFullscreen();
      }
      else if (document.msExitFullscreen)
      {
        document.msExitFullscreen();
      }
    };
    
    $(document).on("fullscreenchange mozfullscreenchange webkitfullscreenchange msfullscreenchange", function()
    {
      if (document.fullscreenElement || document.mozFullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement)
      {
        $ownWindow.trigger("fullscreen:enter");
      }
      else
      {
        $ownWindow.trigger("fullscreen:exit");
      }
    });
  });
  
  return {
    document: $ownWindow,
    floatval: function(value)
    {
      var floatvalue = value;

      if (typeof value !== "number")
      {
        try
        {
          floatvalue = parseFloat(value);
        }
        catch (e)
        {
        }
      }

      if (typeof floatvalue !== "number" || isNaN(floatvalue))
      {
        console.log("Could not convert value to float: \"" + value + "\" (" + (typeof value) + ") -> \"" + floatvalue + "\" (" + typeof floatvalue + ")");
        floatvalue = 0;
      }

      return floatvalue;
    },
    round: function(value, precision)
    {
      return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
    },
    makeDecimalPretty: function(num)
    {
      num = this.floatval(num);

      if (num === 0)
      {
        return "0";
      }

      if (num > 1)
      {
        return this.round(num, 2) + "";
      }

      return "1/" + Math.round(1/num);
    },
    parseQueryString: function(queryString) {
      var params = {};
      var queries = queryString.split("&");
  
      for (var n = 0; n < queries.length; n++) {
          var parts = queries[n].split('=');
          
          if (parts[0].indexOf("[]") === -1) {
            params[parts[0]] = parts[1];
          } else {
            parts[0] = parts[0].replace("[]", "");
            
            params[parts[0]] = params[parts[0]] || [];
            params[parts[0]].push(parts[1]);
          }
      }
  
      return params;
    }
  }
});
