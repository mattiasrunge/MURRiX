
var Logger = require("./logger");
var Chain = require("achain.js");
var CustomTriggers = require("./triggers/custom");
var GenericTriggers = require("./triggers/generic");
var NodeTriggers = require("./triggers/nodes");
var ItemTriggers = require("./triggers/items");

var logger = new Logger("triggers");
var custom_triggers = new CustomTriggers();
var generic_triggers = new GenericTriggers();
var node_triggers = new NodeTriggers();
var item_triggers = new ItemTriggers();

var before_chain = new Chain();

before_chain.add(function(args, options, callback)
{
  custom_triggers.before(options, callback);
});

before_chain.add(function(args, options, callback)
{
  generic_triggers.before(options, callback);
});

before_chain.add(function(args, options, callback)
{
  node_triggers.before(options, callback);
});

before_chain.add(function(args, options, callback)
{
  item_triggers.before(options, callback);
});


var after_chain = new Chain();

after_chain.add(function(args, options, callback)
{
  custom_triggers.after(options, callback);
});

after_chain.add(function(args, options, callback)
{
  generic_triggers.after(options, callback);
});

after_chain.add(function(args, options, callback)
{
  node_triggers.after(options, callback);
});

after_chain.add(function(args, options, callback)
{
  item_triggers.after(options, callback);
});


exports.before = function(event, collection_name, current_doc, new_doc, callback)
{
  var options = {};
  options.event = event;
  options.collection_name = collection_name;
  options.current_doc = current_doc;
  options.new_doc = new_doc;

  before_chain.run(options, function(error, options)
  {
    if (error)
    {
      logger.error("Before-triggers failed, reason: " + error);
      callback(error);
      return;
    }

    callback(null, options.new_doc);
  });
};

exports.after = function(event, collection_name, current_doc, new_doc, callback)
{
  var options = {};
  options.event = event;
  options.collection_name = collection_name;
  options.current_doc = current_doc;
  options.new_doc = new_doc;

  after_chain.run(options, function(error, options)
  {
    if (error)
    {
      logger.error("After-triggers failed, reason: " + error);
      callback(error);
      return;
    }

    callback(null, options.new_doc);
  });
};
