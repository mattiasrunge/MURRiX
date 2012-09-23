
$(function()
{
  /* Create MURRiX context */
  $.murrix = {};
  $.murrix.lib = {};
  $.murrix.module = {};


  /* Create server call function */
  $.murrix.callSimple = function (module, action, data, callback, xhr)
  {
    var transaction_id  = jQuery.now();
    var url             = "?Api=1&TransactionId=" + transaction_id + "&Module=" + module + "&Action=" + action;
    var args            = { "type" : "POST", "url" : url, "dataType" : "json", "data" : data };


    /* If provided use supplied xhr */
    if (xhr)
    {
      args.xhr = function ()
      {
        return xhr;
      };
    }


    /* Set up callback function */
    args.success = function(response_args, text_status, jquery_xhr)
    {
      /* Check that the request succeeded */
      if ("success" != text_status)
      {
        callback(transaction_id, MURRIX_RESULT_CODE_REQUEST_FAILED, null);
        return;
      }


      /* Return data to the caller */
      callback(response_args.TransactionId, response_args.ResultCode, response_args.Data, response_args.Message ? response_args.Message : "Success");
    };

    args.error = function(jquery_xhr, text_status, error)
    {
      console.log(text_status);
      console.log(error);

      /* Return data to the caller */
      callback(transaction_id, MURRIX_RESULT_CODE_REQUEST_FAILED, null);
    };


    /* Call server */
    jQuery.ajax(args);


    /* Return transaction id to caller */
    return transaction_id;
  };


  /* Create server call function */
  $.murrix.call = function (module, action, data, callback, xhr)
  {
    var name = "_FILE_";

    if (!data._FILE_)
    {
      return $.murrix.callSimple(module, action, data, callback, xhr);
    }

    var transaction_id  = jQuery.now();
    var url             = "?Api=1&TransactionId=" + transaction_id + "&Module=" + module + "&Action=" + action;

    var readystatechange_callback = function(event)
    {
      if (xhr.readyState === 4)
      {
        if (xhr.status === 200)
        {
          response_args = jQuery.parseJSON(xhr.responseText);


          /* Return data to the caller */
          callback(response_args.TransactionId, response_args.ResultCode, response_args.Data, response_args.Message ? response_args.Message : "Success");
        }
        else
        {
          console.log(xhr.statusText);
          console.log(xhr.status);

          /* Return data to the caller */
          callback(transaction_id, MURRIX_RESULT_CODE_REQUEST_FAILED, null);
        }
      }
    };


    if (xhr.addEventListener)
    {
      xhr.addEventListener("readystatechange", readystatechange_callback, false);
    }
    else
    {
      xhr.onreadystatechange = readystatechange_callback;
    }

    xhr.open("POST", url, true);

    var boundary = "xxxxxxxxx";

    xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

    var body = "";

    jQuery.each(data, function(name, value)
    {
      if (name != "_FILE_")
      {
        body += "--" + boundary + "\r\n";
        body += "Content-Disposition: form-data; name='" + name + "'\r\n";
        body += "\r\n";
        body += unescape(encodeURIComponent(value)) + "\r\n";
      }
    });

    if (!xhr.sendAsBinary)
    {
      name = "_FILE64_";
      data._FILE_ = window.btoa(data._FILE_);
    }

    body += "--" + boundary + "\r\n";
    body += "Content-Disposition: form-data; name='" + name + "'; filename='" + name + "'\r\n";
    body += "Content-Type: application/octet-stream\r\n";
    body += "\r\n";
    body += data._FILE_;
    body += "\r\n";
    body += "--" + boundary + "--";


    //console.log(data);

    if (xhr.sendAsBinary)
    {
      xhr.sendAsBinary(body);
      body = null;
    }
    else
    {
      xhr.send(body);
      body = null;
    }


    /* Return transaction id to caller */
    return transaction_id;
  };

  $.murrix.makeArray = function(hash)
  {
    var array = [];

    jQuery.each(hash, function(key, value)
    {
      array.push(value);
    });

    return array;
  };

  $.murrix.inArray = function(needle, haystack)
  {
    for (var n = 0; n < haystack.length; n++)
    {
      if (needle === haystack[n])
      {
        return true;
      }
    }

    return true;
  };

  $.murrix.intval = function(value)
  {
    var intvalue = value;

    if (typeof value !== "number")
    {
      try
      {
        intvalue = parseInt(value, 10);
      }
      catch (e)
      {
      }
    }

    if (typeof intvalue !== "number" || isNaN(intvalue))
    {
      console.log("Could not convert value to int: \"" + value + "\" (" + (typeof value) + ") -> \"" + intvalue + "\" (" + typeof intvalue + ")");
      intvalue = 0;
    }

    return intvalue;
  };

  $.murrix.createPath = function(partIndex, primary, secondary)
  {
    var currentPath = document.location.hash;
    var newPath = "";

    var parts = currentPath.split("/");

    if (partIndex > parts.length)
    {
      throw "Supplied partIndex " + partIndex + " is not valid for the current path!";
    }

    while (partIndex >= parts.length)
    {
      parts.push("");
    }

    var args = parts[partIndex].split(":");

    if (primary == null)
    {
      primary = args[0];
    }

    if (secondary == null && args.length > 0)
    {
      secondary = args[1];
    }

    parts[partIndex] = primary;

    if (secondary != null && secondary != "")
    {
      parts[partIndex] += ":" + secondary;
    }

    parts = parts.slice(0, partIndex + 1);

    var newPath = parts.join("/");

    if (newPath[0] != "#")
    {
      newPath = "#" + newPath;
    }

    return newPath;
  };

  $.murrix.updatePath = function(pathString, pathObservable)
  {
    var position = pathString.indexOf("/");
    var result = { primary: { action: "", args: [] }, secondary: "" };

    var primaryString = "";

    if (position === -1)
    {
      primaryString = pathString;
      result.secondary = "";
    }
    else
    {
      primaryString = pathString.substr(0, position);
      result.secondary = pathString.substr(position + 1);
    }

    var primarySplit = primaryString.split(":");

    result.primary.action = primarySplit.shift();
    result.primary.args = primarySplit;

    if (JSON.stringify(result.primary) !== JSON.stringify(pathObservable().primary()))
    {
      pathObservable().primary(result.primary);
    }

    if (result.secondary !== pathObservable().secondary())
    {
      pathObservable().secondary(result.secondary);
    }

    return result;
  };
});
