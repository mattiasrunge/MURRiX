
function MurrixUser(options)
{
  /* Class variable declaration */
  var parent_   = this;
  this.user_id_ = options["user_id"];
  
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
  this.Login = function(username, password, callback)
  {
    if (!username || !password || !callback)
    {
      throw MURRIX_RESULT_CODE_PARAM;
    }
    
    return MurrixCall("user", "Login", { "Username" : username, "Password" : SHA1(password) }, function(transaction_id, result_code, response_data)
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
  this.Logout = function(callback)
  {
    if (!callback)
    {
      throw MURRIX_RESULT_CODE_PARAM;
    }
    
    return MurrixCall("user", "Logout", { }, function(transaction_id, result_code, response_data)
    {
      callback(transaction_id, result_code, response_data["Node"]);
    });
  }
}

$(function()
{
  murrix_modules["user"] = new MurrixUser(murrix_module_options["user"]);
})
