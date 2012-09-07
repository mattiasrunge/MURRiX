
$(function()
{
  $.murrix.module.db = new function()
  {
    /* Class variable declaration */
    var self = this;

    self.nodes_  = {};
    self.fetchNodesQueue_ = [];
    self.fetchNodesActive_ = false;
    
      
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
    self.createNode = function(node_data, callback)
    {
      if (!node_data || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      return $.murrix.call("db", "CreateNode", { "Node" : node_data }, function(transaction_id, result_code, response_data)
      {
        self.nodes_[response_data.Node.id] = response_data.Node;
        
        callback(transaction_id, result_code, response_data.Node);
      });
    };


    self.addPositions = function(node_id, position_list, callback)
    {
      if (!node_id || !position_list || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      return $.murrix.call("db", "AddPositions", { "NodeId" : node_id, "PositionList" : position_list }, function(transaction_id, result_code, response_data)
      {
        callback(transaction_id, result_code);
      });
    };


    /**
     * Create a new node from a uploaded file.
     *
     * Callback(int transaction_id, MURRIX_RESULT_CODE result, JSON data)
     *   param transaction_id - Transaction ID.
     *   param result_code    - MURRIX_RESULT_CODE_OK on success.
     *   param node_data      - Node data JSON object of the created node.
     *
     *
     * @param upload_id - Id used when uploading a file.
     * @param filename  - File name of the file.
     * @param filesize  - Size of the file.
     * @param metadata  - Metadata received in the upload call.
     * @param callback  - Result callback function.
     *
     * @return          - Transaction ID.
     * @throws          - MURRIX_RESULT_CODE
     */
    self.createNodeFromFile = function(upload_id, filename, filesize, metadata, callback)
    {
      if (!upload_id || !filename || !filesize || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      var node_data = {};

      node_data.type        = "file";
      node_data.name        = filename;
      node_data.uploadid    = upload_id;
      node_data.filename    = filename;
      node_data.description = "";

      node_data.attributes = {};

      node_data.attributes.FileSize = filesize;
      node_data.attributes.FileName = filename;

      if (metadata)
      {
        console.log(metadata);
        jQuery.each(metadata, function(name, value)
        {
          console.log(name + ":" + value);
          node_data.attributes["Meta" + name] = value;
        });
      }

      return self.createNode(node_data, callback);
    };


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
    self.uploadFile = function(upload_id, last_chunk, data, callback, progress_callback)
    {
      var xhr = null;

      if (!upload_id || !data || !callback)
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


      return $.murrix.call("db", "UploadFile", { "Id" : upload_id, "LastChunk" : last_chunk, "Sha1" : 0/*SHA1(data)*/, "_FILE_" : data }, function(transaction_id, result_code, response_data)
      {
        if (MURRIX_RESULT_CODE_OK == result_code)
        {
          callback(transaction_id, result_code, response_data.Metadata);
        }
        else
        {
          callback(transaction_id, result_code, {});
        }

      }, xhr);
    };

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
    self.updateNode = function(node_data, callback)
    {
      if (!node_data || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      return $.murrix.call("db", "UpdateNode", { "Node" : node_data }, function(transaction_id, result_code, response_data)
      {
        self.nodes_[response_data.Node.id] = response_data.Node;
        
        callback(transaction_id, result_code, response_data.Node);
      });
    };

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
    self.deleteNode = function(node_id, callback)
    {
      if (!node_id || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      return $.murrix.call("db", "DeleteNode", { "NodeId" : node_id }, function(transaction_id, result_code, response_data)
      {
        callback(transaction_id, result_code, response_data.Node);
      });
    };

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
    self.linkNodes = function(node_id_up, node_id_down, role, callback)
    {
      if (!node_id_up || !node_id_down || !role || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      return $.murrix.call("db", "LinkNodes", { "NodeIdUp" : node_id_up, "NodeIdDown" : node_id_down, "Role" : role }, function(transaction_id, result_code, response_data)
      {
        self.nodes_[response_data.NodeUp.id] = response_data.NodeUp;
        self.nodes_[response_data.NodeDown.id] = response_data.NodeDown;
        
        callback(transaction_id, result_code, response_data.NodeUp, response_data.NodeDown, response_data.Role);
      });
    };

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
    self.unlinkNodes = function(node_id_up, node_id_down, role, callback)
    {
      if (!node_id_up || !node_id_down || !role || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      return $.murrix.call("db", "UnlinkNodes", { "NodeIdUp" : node_id_up, "NodeIdDown" : node_id_down, "Role" : role }, function(transaction_id, result_code, response_data)
      {
        self.nodes_[response_data.NodeUp.id] = response_data.NodeUp;
        self.nodes_[response_data.NodeDown.id] = response_data.NodeDown;
        
        callback(transaction_id, result_code, response_data.NodeUp, response_data.NodeDown, response_data.Role);
      });
    };

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
    self.searchNodes = function(query, callback)
    {
      var self = self;

      if (!query || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      self.searchNodeIds(query, function(transaction_id, result_code, node_id_list)
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
    };

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
    self.searchNodeIds = function(query, callback)
    {
      if (!query || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      return $.murrix.call("db", "SearchNodeIds", { "Query" : query }, function(transaction_id, result_code, response_data)
      {
        var node_id_list = response_data.NodeIdList ? response_data.NodeIdList : [];

        callback(transaction_id, result_code, node_id_list);
      });
    };


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
    self.fetchNodes = function(node_id_list, callback)
    {
      if (!node_id_list || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      return $.murrix.call("db", "FetchNodes", { "NodeIdList" : node_id_list }, function(transaction_id, result_code, response_data)
      {
        var node_data_list = response_data.NodeList ? response_data.NodeList : {};

        jQuery.each(node_data_list, function(id, node)
        {
          self.nodes_[id] = node;
        });
        
        callback(transaction_id, result_code, node_data_list);
      });
    };

    self.fetchPositions = function(query, callback)
    {
      if (!query || !callback)
      {
        throw MURRIX_RESULT_CODE_PARAM;
      }

      return $.murrix.call("db", "FetchPositions", { "Query" : query }, function(transaction_id, result_code, response_data)
      {
        var position_list = response_data.PositionList ? response_data.PositionList : {};

        callback(transaction_id, result_code, position_list);
      });
    };

    self.fetchNodesBuffered = function(node_id_list, callback)
    {
      if (self.fetchNodesActive_)
      {
        self.fetchNodesQueue_.push({ node_id_list: node_id_list, callback: callback });

        return "queued";
      }

      var response_list = {};
      var request_node_id_list = [];

      for (var n = 0; n < node_id_list.length; n++)
      {
        if (self.nodes_[node_id_list[n]])
        {
          response_list[node_id_list[n]] = self.nodes_[node_id_list[n]];
        }
        else
        {
          request_node_id_list.push(node_id_list[n]);
        }
      }

      if (request_node_id_list.length === 0)
      {
        callback(0, MURRIX_RESULT_CODE_OK, response_list);

        self.runFetchNodesBuffered();
        return 0;
      }

      self.fetchNodesActive_ = true;

      var tid = self.fetchNodes(request_node_id_list, function(transaction_id, result_code, node_list)
      {
        self.fetchNodesActive_ = false;

        jQuery.each(node_list, function(id, node)
        {
          self.nodes_[id] = node;
          response_list[id] = node;
        });

        callback(transaction_id, result_code, response_list);

        self.runFetchNodesBuffered();
      });

      return tid;
    };

    self.runFetchNodesBuffered = function()
    {
      if (self.fetchNodesQueue_.length > 0)
      {
        var queue_item = self.fetchNodesQueue_.pop();

        self.fetchNodesBuffered(queue_item.node_id_list, queue_item.callback);
      }
    };
  }();
});
