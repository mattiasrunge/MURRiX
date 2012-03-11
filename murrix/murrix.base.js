
(function($)
{
  /* Create MURRiX context */
  $.murrix = {};
  $.murrix.module_options = {};
  $.murrix.libs = {};
  $.murrix.module = {};
  $.murrix.wizard = {};
    
  
  /* Create server call function */
  $.murrix.call = function (module, action, data, callback)
  {
    var transaction_id  = jQuery.now();
    var url             = "?Api=1";
    var request_args    = { "TransactionId" : transaction_id, "Module" : module, "Action" : action, "Data" : data };
    
    
    /* Post request to server */
    jQuery.post(url, request_args, function(response_args, text_status)
    {
      /* Check that the request succeeded */
      if ("success" != text_status)
    {
      callback(transaction_id, MURRIX_RESULT_CODE_REQUEST_FAILED, null);
      return;
    }
    
    
    
    /* Return data to the caller */
    callback(response_args["TransactionId"], response_args["ResultCode"], response_args["Data"]);
    
    }, "json");


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
