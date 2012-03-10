
$(function()
{
  $.murrix.module.user = new function()
  {
    /* Class variable declaration */
    var parent_             = this;
    this.user_id_           = $.murrix.module_options.user["user_id"];
    this.default_username_  = $.murrix.module_options.user["default_username"];
    
    
    /* Public methods */
    
    /**
    * Login a user.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, JSON data)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_data      - Node data JSON object for the new user.
    *  
    * 
    * @param username  - Username of user to login.
    * @param password  - Password of user to login.
    * @param callback  - Result callback function.
    *  
    * @return          - Transaction ID.
    * @throws          - MURRIX_RESULT_CODE
    */
    this.login = function(username, password, callback)
    {
      if (!username || !password || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      return $.murrix.call("user", "Login", { "Username" : username, "Password" : SHA1(password) }, function(transaction_id, result_code, response_data)
      {
        callback(transaction_id, result_code, response_data["Node"]);
      });
    }
    
    /**
    * Logout and go to default user.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, JSON data)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_data      - Node data JSON object for the new user.
    *  
    * 
    * @param callback  - Result callback function.
    *  
    * @return          - Transaction ID.
    * @throws          - MURRIX_RESULT_CODE
    */
    this.logout = function(callback)
    {
      if (!callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      return $.murrix.call("user", "Logout", { }, function(transaction_id, result_code, response_data)
      {
        callback(transaction_id, result_code, response_data["Node"]);
      });
    }
    
    
    this.getUser = function(callback)
    {
      if (!callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      $.murrix.module.db.fetchNodes([ parent_.user_id_ ], function(transaction_id, result_code, node_data_list)
      {
        callback(transaction_id, result_code, result_code == MURRIX_RESULT_CODE_OK ? node_data_list[parent_.user_id_] : null);
      });
    }
    
    this.getDefaultUsername = function()
    {
      return parent_.default_username_;
    }
  }

  $.murrix.module.user.wizard = {};
})
