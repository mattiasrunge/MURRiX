
var Logger = require("../logger");
var Chain = require("achain.js");
var utils = require("../utils");
var db = require("../db");

var logger = new Logger("triggers");
var before_chain = new Chain();
var after_chain = new Chain();


///////////////////////////////////////////////////////////////////
// Before chain
///////////////////////////////////////////////////////////////////

before_chain.add(function(args, options, callback)
{
  db.find({ event: options.event, collection: options.collection_name }, "triggers", function(error, triggers)
  {
    if (error)
    {
      callback("Unable to find triggers, reason: " + error);
      return;
    }

    for (var id in triggers)
    {
      var trigger = triggers[id];
      var matched = true;

      for (var n = 0; n < trigger.criterias.length; n++)
      {
        if (trigger.criterias[n].match === "eq")
        {
          if (options.new_doc[trigger.criterias[n].key] !== trigger.criterias[n].value)
          {
            matched = false;
            break;
          }
        }
        else if (trigger.criterias[n].match === "ne")
        {
          if (options.new_doc[trigger.criterias[n].key] === trigger.criterias[n].value)
          {
            matched = false;
            break;
          }
        }
        else if (trigger.criterias[n].match === "in")
        {
          if (!utils.array.in(trigger.criterias[n].value, options.new_doc[trigger.criterias[n].key]))
          {
            matched = false;
            break;
          }
        }
        else if (trigger.criterias[n].match === "nin")
        {
          if (utils.array.in(trigger.criterias[n].value, options.new_doc[trigger.criterias[n].key]))
          {
            matched = false;
            break;
          }
        }
        else
        {
          logger.error("Unknown match type:" + trigger.criterias[n].match);
          logger.debug(trigger.criterias[n]);
          matched = false;
        }
      }

      if (matched)
      {
        for (var n = 0; n < trigger.actions.length; n++)
        {
          if (trigger.actions[n].action === "set")
          {
            options.new_doc[trigger.actions[n].key] = trigger.actions[n].value;
          }
          else if (trigger.actions[n].action === "push")
          {
            options.new_doc[trigger.actions[n].key] = options.new_doc[trigger.actions[n].key] || [];
            options.new_doc[trigger.actions[n].key].push(trigger.actions[n].value);
          }
        }
      }
    }

    callback();
  });
});


module.exports = function()
{
  var self = this;

  self.before = function(options, callback)
  {
    before_chain.run(options, callback);
  };

  self.after = function(options, callback)
  {
    after_chain.run(options, callback);
  };

  self.load = function(filepath, callback)
  {
    var chain = new Chain();

    fs.exists(filepath, function(exists)
    {
      if (exists)
      {
        var triggers = require(filepath);

        logger.info("Loaded " + filepath + " with " + triggers.length + " custom triggers.");

        chain.addMany(triggers, function(trigger, options, callback)
        {
          // For legacy convert old names
          if (trigger.event.indexOf("Node"))
          {
            trigger.event.collection_name = "nodes";
          }
          else if (trigger.event.indexOf("Item"))
          {
            trigger.event.collection_name = "items";
          }

          if (trigger.event.indexOf("create"))
          {
            trigger.event.event = "create";
          }
          else if (trigger.event.indexOf("update"))
          {
            trigger.event.event = "update";
          }
          else if (trigger.event.indexOf("remove"))
          {
            trigger.event.event = "remove";
          }

          db.save(trigger, "triggers", callback);
        });
      }
    });

    chain.run(callback);
  };
};
