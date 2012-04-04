/*
if (!window.BlobBuilder && window.WebKitBlobBuilder)
{
  window.BlobBuilder = window.WebKitBlobBuilder;
}

if (!XMLHttpRequest.sendAsBinary)
{
  XMLHttpRequest.prototype.sendAsBinary = function(datastr)
  {
    var time = jQuery.now();
    
    var bb = new BlobBuilder();
    var data = new ArrayBuffer(1);
    var ui8a = new Uint8Array(data, 0);
    
    for (var i in datastr)
    {
      if (datastr.hasOwnProperty(i))
      {
        var chr = datastr[i];
        var charcode = chr.charCodeAt(0)
        var lowbyte = (charcode & 0xff)
        
        ui8a[0] = lowbyte;
        
        bb.append(data);
      }
    }
    
    datastr = null;
    data = null;
    
    var blob = bb.getBlob();
    
    console.log("time:" + (jQuery.now() - time));
    
    this.send(blob);
    
    blob = null;
  }
}*/

(function($)
{
  /* Create MURRiX context */
  $.murrix = {};
  $.murrix.module_options = {};
  $.murrix.libs = {};
  $.murrix.module = {};
  $.murrix.wizard = {};
    
  
  /* Create server call function */
  $.murrix.callSimple = function (module, action, data, callback, xhr)
  {
    var transaction_id  = jQuery.now();
    var url             = "?Api=1&TransactionId=" + transaction_id + "&Module=" + module + "&Action=" + action;
    var args            = { "type" : "POST", "url" : url, "dataType" : "json", "data" : data };


    /* If provided use supplied xhr */
    if (xhr)
    {
      args["xhr"] = function ()
      {
        return xhr;
      };  
    }
    
    
    /* Set up callback function */
    args["success"] = function(response_args, text_status, jquery_xhr)
    {
      /* Check that the request succeeded */
      if ("success" != text_status)
      {
        callback(transaction_id, MURRIX_RESULT_CODE_REQUEST_FAILED, null);
        return;
      }
      
      
      /* Return data to the caller */
      callback(response_args["TransactionId"], response_args["ResultCode"], response_args["Data"]);
    }
    
    args["error"] = function(jquery_xhr, text_status, error)
    {
      console.log(text_status);
      console.log(error);
      
      /* Return data to the caller */
      callback(transaction_id, MURRIX_RESULT_CODE_REQUEST_FAILED, null);
    }
    

    /* Call server */
    jQuery.ajax(args); 
    

    /* Return transaction id to caller */
    return transaction_id;
  }
  
  
  /* Create server call function */
  $.murrix.call = function (module, action, data, callback, xhr)
  {
    var name = "_FILE_";
    
    if (!data["_FILE_"])
    {
      return $.murrix.callSimple(module, action, data, callback, xhr);
    }
    
    var transaction_id  = jQuery.now();
    var url             = "?Api=1&TransactionId=" + transaction_id + "&Module=" + module + "&Action=" + action;

    var readystatechange_callback = function(event)
    {
      if (xhr.readyState == 4)
      {
        if (xhr.status == 200)
        {
          response_args = jQuery.parseJSON(xhr.responseText);
          
          
          /* Return data to the caller */
          callback(response_args["TransactionId"], response_args["ResultCode"], response_args["Data"]);
        }
        else
        {
          console.log(xhr.statusText);
          console.log(xhr.status);
          
          /* Return data to the caller */
          callback(transaction_id, MURRIX_RESULT_CODE_REQUEST_FAILED, null);
        }
      }
    }
    
    
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
      data["_FILE_"] = window.btoa(data["_FILE_"]);
    }
    
    body += "--" + boundary + "\r\n";
    body += "Content-Disposition: form-data; name='" + name + "'; filename='" + name + "'\r\n";
    body += "Content-Type: application/octet-stream\r\n";
    body += "\r\n";
    body += data["_FILE_"];
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
  }
  
  $.murrix.makeArray = function(hash)
  {
    var array = [];
    
    jQuery.each(hash, function(key, value)
    {
      array.push(value);
    });
    
    return array;
  }
  
})(jQuery);
