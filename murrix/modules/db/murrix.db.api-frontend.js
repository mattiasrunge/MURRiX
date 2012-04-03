
$(function()
{
  $.murrix.wizard.db = {};
  
  $.murrix.module.db = new function()
  {
    /* Class variable declaration */
    var parent_   = this;


    /* Public methods */
  
    /**
    * Create a new node.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, JSON data)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_data      - Node data JSON object of the created node.
    *  
    * 
    * @param node_data - Node data JSON object, should not have a valid id.
    * @param callback  - Result callback function.
    *  
    * @return          - Transaction ID.
    * @throws          - MURRIX_RESULT_CODE
    */
    this.createNode = function(node_data, callback)
    {
      if (!node_data || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      return $.murrix.call("db", "CreateNode", { "Node" : node_data }, function(transaction_id, result_code, response_data)
      {
        callback(transaction_id, result_code, response_data["Node"]);
      });
    }
    
    
    /**
     * Upload a file and create a node.
     * 
     * CallbackProgress(int transaction_id, file, current_chunk, number_of_chunks)
     *   param file_name        - Name of file.
     *   param action           - String: uploading/loading
     *   param size             - Size of file.
     *   param bytes_loaded     - Number of bytes loaded.
     * 
     * 
     * CallbackComplete(int transaction_id, MURRIX_RESULT_CODE result, JSON data)
     *   param result_code    - MURRIX_RESULT_CODE_OK on success.
     *   param node_data      - Node data JSON object of the created node.
     *   param metadata       - File metadata
     *  
     * 
     * @param file              - File object.
     * @param callback_progress - Progress callback function.
     * @param callback_complete - Result callback function.
     *  
     * @return          - Transaction ID.
     * @throws          - MURRIX_RESULT_CODE
     */
    this.uploadFile = function(id, last_chunk, data, callback, progress_callback)
    {
      var xhr = null;
      
      if (!id || !data || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      if (progress_callback)
      {
        xhr = jQuery.ajaxSettings.xhr();
        
        if (xhr.upload)
        {
          if (xhr.upload.addEventListener)
          {
            xhr.upload.addEventListener("progress", progress_callback, false);
          }
          else
          {
            xhr.upload.progress = progress_callback;
          }
        }   
      }
      
     
     return $.murrix.callV2("db", "UploadFile", { "Id" : id, "LastChunk" : last_chunk, "Sha1" : 0/*SHA1(data)*/, "_FILE_" : data }, function(transaction_id, result_code, response_data)
      {
        if (MURRIX_RESULT_CODE_OK == result_code)
        {
          callback(transaction_id, result_code, response_data["metadata"]);
        }
        else
        {
          callback(transaction_id, result_code, {});
        }
          
      }, xhr);
    }
    
    /**
    * Update an existing node.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, JSON data)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_data      - Node data JSON object of the updated node.
    *  
    * 
    * @param node_data - Node data JSON object, must have a valid id.
    * @param callback  - Result callback function.
    *  
    * @return          - Transaction ID.
    */
    this.updateNode = function(node_data, callback)
    {
      if (!node_data || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      return $.murrix.call("db", "UpdateNode", { "Node" : node_data }, function(transaction_id, result_code, response_data)
      {
        callback(transaction_id, result_code, response_data["Node"]);
      });
    }
    
    /**
    * Delete an existing node.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, JSON data)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_data      - Node data JSON object the deleted node.
    *  
    * 
    * @param node_id   - Node data JSON object.
    * @param callback  - Result callback function.
    *  
    * @return          - Transaction ID.
    */
    this.deleteNode = function(node_id, callback)
    {
      if (!node_id || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      return $.murrix.call("db", "DeleteNode", { "NodeId" : node_id }, function(transaction_id, result_code, response_data)
      {
        callback(transaction_id, result_code, response_data["Node"]);
      });
    }
    
    /**
    * Link two nodes together.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, JSON data_up, JSON data_down, string role)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_data_up   - Node data JSON object for top node.
    *   param node_data_down - Node data JSON object for bottom node.
    *   param role           - Role relationship between nodes.
    *  
    * 
    * @param node_id_up    - Node data JSON object for top most node.
    * @param node_id_down  - Node data JSON object for bottom most node.
    * @param role          - Role relationship between nodes.
    * @param callback      - Result callback function.
    *  
    * @return           - Transaction ID.
    */
    this.linkNodes = function(node_id_up, node_id_down, role, callback)
    {
      if (!node_id_up || !node_id_down || !role || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      return $.murrix.call("db", "LinkNodes", { "NodeIdUp" : node_id_up, "NodeIdDown" : node_id_down, "Role" : role }, function(transaction_id, result_code, response_data)
      {
        callback(transaction_id, result_code, response_data["NodeUp"], response_data["NodeDown"], response_data["Role"]);
      });
    }
    
    /**
    * Unlink two nodes from eachother.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, JSON data_up, JSON data_down, string role)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_data_up   - Node data JSON object for top node.
    *   param node_data_down - Node data JSON object for bottom node.
    *   param role           - Role relationship between nodes.
    *  
    * 
    * @param node_id_up    - Node data JSON object for top most node.
    * @param node_id_down  - Node data JSON object for bottom most node.
    * @param role          - Role relationship between nodes.
    * @param callback      - Result callback function.
    *  
    * @return           - Transaction ID.
    */
    this.unlinkNodes = function(node_id_up, node_id_down, role, callback)
    {
      if (!node_id_up || !node_id_down || !role || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      return $.murrix.call("db", "UnlinkNodes", { "NodeIdUp" : node_id_up, "NodeIdDown" : node_id_down, "Role" : role }, function(transaction_id, result_code, response_data)
      {
        callback(transaction_id, result_code, response_data["NodeUp"], response_data["NodeDown"], response_data["Role"]);
      });
    }
    
    /**
    * Search for nodes based on a query object.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, int[] id_list)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_list      - List of nodes matching the query.
    *  
    * 
    * @param query      - Data JSON object with query data.
    * @param callback   - Result callback function.
    *  
    * @return           - Transaction ID.
    */
    this.searchNodes = function(query, callback)
    {
      var self = this;
      
      if (!query || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      this.searchNodeIds(query, function(transaction_id, result_code, node_id_list)
      {
        if (MURRIX_RESULT_CODE_OK == result_code && node_id_list.length > 0)
        {
          self.fetchNodes(node_id_list, callback);
        }
        else
        {
          callback(transaction_id, result_code, []);
        }
      });
    }
    
    /**
    * Search for node ids based on a query object.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, int[] id_list)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_id_list   - List of node IDs matching the query.
    *  
    * 
    * @param query      - Data JSON object with query data.
    * @param callback   - Result callback function.
    *  
    * @return           - Transaction ID.
    */
    this.searchNodeIds = function(query, callback)
    {
      if (!query || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      return $.murrix.call("db", "SearchNodeIds", { "Query" : query }, function(transaction_id, result_code, response_data)
      {
        var node_id_list = response_data["NodeIdList"] ? response_data["NodeIdList"] : [];
        
        callback(transaction_id, result_code, node_id_list);
      });
    }
    
    
    /**
    * Get nodes identified by node ID list.
    * 
    * Callback(int transaction_id, MURRIX_RESULT_CODE result, JSON[] data_list)
    *   param transaction_id - Transaction ID.
    *   param result_code    - MURRIX_RESULT_CODE_OK on success.
    *   param node_data_list - List of JSON node objects.
    *  
    * 
    * @param node_id_list    - List of Node IDs.
    * @param callback   - Result callback function.
    *  
    * @return           - Transaction ID.
    */
    this.fetchNodes = function(node_id_list, callback)
    {
      if (!node_id_list || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }
      
      return $.murrix.call("db", "FetchNodes", { "NodeIdList" : node_id_list }, function(transaction_id, result_code, response_data)
      {
        var node_data_list = response_data["NodeList"] ? response_data["NodeList"] : {};
        
        callback(transaction_id, result_code, node_data_list);
      });
    }
  }
  
  $.murrix.module.db.wizard = {};

})
