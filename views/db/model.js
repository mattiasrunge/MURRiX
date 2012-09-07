
var NodeAttributeMapping = function(data)
{
  ko.mapping.fromJS(data, {}, this);

  this.editing = ko.observable(false);
  this.originalValue = ko.observable(this.value());
};

var NodeMapping = {
  create: function(options)
  {
    var node = ko.mapping.fromJS(options.data, NodeMappingInternal, this);

    return node;
  }
};

var NodeMappingInternal = {
  attributes: {
    key: function(data)
    {
      return ko.utils.unwrapObservable(data.name);
    },
    create: function(options)
    {
      return new NodeAttributeMapping(options.data);
    }
  },
  id: {
    create: function(options)
    {
      var value = options.data;
    
      if (typeof value != "number")
      {
        value = parseInt(value, 10);
      }

      return ko.observable(value);
    }
  },
  description: {
    create: function(options)
    {
      options.parent.descriptionEditing = ko.observable(false);
      options.parent.descriptionOriginal = ko.observable(options.data);

      return ko.observable(options.data);
    }
  },
  name: {
    create: function(options)
    {
      options.parent.nameEditing = ko.observable(false);
      options.parent.nameOriginal = ko.observable(options.data);

      return ko.observable(options.data);
    }
  },
  type: {
    create: function(options)
    {
      options.parent.typeEditing = ko.observable(false);
      options.parent.typeOriginal = ko.observable(options.data);

      return ko.observable(options.data);
    }
  }
};

var NodeListMapping = {
  key: function(data)
  {
    var value = ko.utils.unwrapObservable(data.id);
//   console.log("NodeListMapping: value = " + value);
//   console.log(value);
    if (typeof value != "number")
    {
      return parseInt(value, 10);
    }
  
    return value;
  }
};

//var node = ko.mapping.fromJS(nodeData, NodeMapping);


var DbModel = function(parentModel)
{
  var self = this;

  self.nodes = {}
  self.fetchNodesActive = false;
  self.fetchNodesQueue = [];


  self.cacheNodesInternal = function(nodeDataList)
  {
    var nodeList = [];

    jQuery.each(nodeDataList, function(id, nodeData)
    {
      if (!self.nodes[id])
      {
        console.log("DbModel: Could not find mapped index, node is not cached, id " + id);

        self.nodes[id] = ko.mapping.fromJS(nodeData, NodeMappingInternal);

        //console.log(id, self.nodes[id].id(), self.nodes[id].name());
      }
      else
      {
        console.log("DbModel: Node " + id + " already cached updating cache...");
        ko.mapping.fromJS(nodeData, self.nodes[id]);
      }


      self.nodes[id].attr = function()
      {
        var count = 0;

        while (count < arguments.length)
        {
          var attribute = this.attributes()[this.attributes.mappedIndexOf({ name: arguments[count] })];

          if (attribute)
          {
            return attribute.value();
          }

          count++;
        }

        return null;
      };

      self.nodes[id].getLinkedNodes = function(role, callback)
      {
        var linkedIdList = [];

        for (var n = 0; n < this.links().length; n++)
        {
          var link = this.links()[n];

          if (!role || link.role() === role)
          {
            linkedIdList.push(link.node_id());
          }
        }

        if (linkedIdList.length > 0)
        {
          mainModel.dbModel.fetchNodesBuffered(linkedIdList, function(transactionId, resultCode, nodeList)
          {
            if (resultCode != MURRIX_RESULT_CODE_OK)
            {
              console.log("Got error while trying to fetch required nodes, resultCode = " + resultCode);
              callback(resultCode, [], []);
            }
            else
            {
              var list = [];

              jQuery.each(nodeList, function(id, listNode)
              {
                list.push(listNode);
              });

              callback(MURRIX_RESULT_CODE_OK, linkedIdList, list);
            }
          });
        }
        else
        {
          callback(MURRIX_RESULT_CODE_OK, [], []);
        }

        return linkedIdList;
      };

      console.log("DbModel: Added node to list to list id " + id);
      nodeList.push(self.nodes[id]);
    });

    return nodeList;
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
  * Callback(int transactionId, MURRIX_RESULT_CODE result, JSON[] data_list)
  *   param transactionId - Transaction ID.
  *   param resultCode    - MURRIX_RESULT_CODE_OK on success.
  *   param node_data_list - List of JSON node objects.
  *
  *
  * @param nodeIdList    - List of Node IDs.
  * @param callback   - Result callback function.
  *
  * @return           - Transaction ID.
  */
  self.fetchNodes = function(nodeIdList, callback)
  {
    if (!nodeIdList)
    {
      throw MURRIX_RESULT_CODE_PARAM;
    }

    return $.murrix.call("db", "FetchNodes", { "NodeIdList" : nodeIdList }, function(transactionId, resultCode, responseData)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        if (callback)
        {
          callback(transactionId, resultCode, {});
          return;
        }
      }
    
      var nodeList = self.cacheNodesInternal(responseData.NodeList ? responseData.NodeList : {});

      if (callback)
      {
        callback(transactionId, resultCode, nodeList);
      }
    });
  };

  self.fetchPositions = function(query, callback)
  {
    if (!query || !callback)
    {
      console.log(query, callback);
      throw MURRIX_RESULT_CODE_PARAM;
    }

    return $.murrix.call("db", "FetchPositions", { "Query" : query }, function(transactionId, resultCode, responseData)
    {
      var positionList = responseData.PositionList ? responseData.PositionList : {};

      callback(transactionId, resultCode, positionList);
    });
  };

  self.fetchNodesBufferedIndexed = function(nodeIdList, callback)
  {
    self.fetchNodesBuffered(nodeIdList, function(transactionId, resultCode, nodeList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        callback(transactionId, resultCode, nodeList);
      }
      else
      {
        var indexedNodeList = {};

        for (var n = 0; n < nodeList.length; n++)
        {
          indexedNodeList[nodeList[n].id()] = nodeList[n];
        }

        callback(transactionId, resultCode, indexedNodeList);
      }
    });
  };
  
  self.fetchNodesBuffered = function(nodeIdList, callback)
  {
    if (self.fetchNodesActive)
    {
      self.fetchNodesQueue.push({ nodeIdList: nodeIdList, callback: callback });

      return "queued";
    }

    var responseList = [];
    var requestNodeIdList = [];

    for (var n = 0; n < nodeIdList.length; n++)
    {
      if (!self.nodes[nodeIdList[n]])
      {
        requestNodeIdList.push(nodeIdList[n]);
      }
      else
      {
        responseList.push(self.nodes[nodeIdList[n]]);
      }
    }

    if (requestNodeIdList.length === 0)
    {
      callback(0, MURRIX_RESULT_CODE_OK, responseList);

      self.runFetchNodesBuffered();
      return 0;
    }

    self.fetchNodesActive = true;

    var tid = self.fetchNodes(requestNodeIdList, function(transactionId, resultCode, nodeList)
    {
      self.fetchNodesActive = false;

      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        if (callback)
        {
          callback(transactionId, resultCode, {});
        }
      }
      else
      {
        callback(transactionId, resultCode, nodeList.concat(responseList));
      }

      self.runFetchNodesBuffered();
    });

    return tid;
  };

  self.runFetchNodesBuffered = function()
  {
    if (self.fetchNodesQueue.length > 0)
    {
      var queue_item = self.fetchNodesQueue.pop();

      self.fetchNodesBuffered(queue_item.nodeIdList, queue_item.callback);
    }
  };
};
