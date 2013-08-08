
var util = require("util");
var events = require("events");
var moment = require("moment");
var path = require("path");
var MurrixChain = require("./chain.js").MurrixChain;

function MurrixHelpersManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "helpers";

  murrix.client.on("done", function()
  {
    murrix.client.register("helper_nodeGetRelations", function(session, args, callback)
    {
      var options = { collection: "nodes" };
      var count = 0;

      var createPerson = function(type, id, callbackPerson)
      {
        murrix.db.findOneWithRights(session, { _id: id, type: "person" }, options, function(error, nodeData)
        {
          if (error)
          {
            callbackPerson("Could get root person (" + id + "), reason: " + error);
            return;
          }

          var person = {};
          person._id = nodeData._id;
          person.name = nodeData.name;
          person.gender = nodeData.gender;
          person.type = type;

          person.parents = [];
          person.partner = false;
          person.children = [];
          person.profilePicture = false;

          person.birth = false;
          person.death = false;

          count++;


          var chain = new MurrixChain();

          if ((type === "me" || type === "parent") && nodeData.family && nodeData.family.parents)
          {
            for (var n = 0; n < nodeData.family.parents.length; n++)
            {
              chain.add(nodeData.family.parents[n]._id, function(id, options2, chainCallback)
              {
                createPerson("parent", id, function(error, parent)
                {
                  if (error)
                  {
                    murrix.logger.error(self.name, "Failed to get parent#1 (" + id + "), reason: " + error);
                    chainCallback();
                    return;
                  }

                  person.parents.push(parent);
                  chainCallback();
                });
              });
            }
          }

          if (nodeData.family && nodeData.family._partner)
          {
            chain.add(nodeData.family._partner, function(partnerId, options2, chainCallback)
            {
              var options = { collection: "nodes", fields: { _id: true, tagSearch: true, name: true } };

              murrix.db.findOneWithRights(session, { _id: partnerId }, options, function(error, nodeDataPartner)
              {
                if (error)
                {
                  murrix.logger.error(self.name, "Failed to get partner (" + partnerId + ", reason: ", error);
                  chainCallback();
                  return;
                }

                person.partner = { _id: nodeDataPartner._id, name: nodeDataPartner.name };
                chainCallback();
              });
            });
          }

          if (type === "me" || type === "child")
          {
            chain.add(null, function(data, options2, chainCallback)
            {
              var options = { collection: "nodes", fields: { _id: true, tagSearch: true } };

              murrix.db.findWithRights(session, { "family.parents._id": nodeData._id }, options, function(error, nodeDataChildList)
              {
                if (error)
                {
                  chainCallback("Failed to get parent#2 (" + nodeData._id + "), reason: " + error);
                  return;
                }

                var childChain = new MurrixChain();

                for (var n = 0; n < nodeDataChildList.length; n++)
                {
                  childChain.add(nodeDataChildList[n]._id, function(id, options2, chainChildCallback)
                  {
                    createPerson("child", id, function(error, child)
                    {
                      if (error)
                      {
                        chainChildCallback("Failed to get child (" + id + "), reason: " + error);
                        return;
                      }

                      person.children.push(child);
                      chainChildCallback();
                    });
                  });
                }

                childChain.final(function(error)
                {
                  if (error)
                  {
                    chainCallback(error);
                    return;
                  }

                  chainCallback();
                });

                childChain.run();
              });
            });
          }

          if (nodeData._profilePicture)
          {
            chain.add(nodeData._profilePicture, function(profilePictureId, options2, chainCallback)
            {
              var options = { collection: "items", fields: { _id: true, tagSearch: true, cacheId: true } };

              murrix.db.findOneWithRights(session, { _id: profilePictureId }, options, function(error, itemDataProfilePictures)
              {
                if (error)
                {
                  chainCallback("Failed to get profile picture item, reason: " + error);
                  return;
                }

                person.profilePicture = { _id: itemDataProfilePictures._id, name: itemDataProfilePictures.cacheId };
                chainCallback();
              });
            });
          }

          chain.add(null, function(data, options2, chainCallback)
          {
            var query = { $or: [] };
            query.what = "text";
            query._parents = nodeData._id;
            query.$or.push({ type: "birth" });
            query.$or.push({ type: "death" });

            var options = { collection: "items", fields: { _id: true, tagSearch: true, when: true, type: true } };

            murrix.db.findWithRights(session, query, options, function(error, itemDataList)
            {
              if (error)
              {
                chainCallback("Failed to get birth/death items, reason: " + error);
                return;
              }

              for (var n = 0; n < itemDataList.length; n++)
              {
                if (itemDataList[n].when && itemDataList[n].when.source && itemDataList[n].when.source.datestring)
                {
                  if (itemDataList[n].type === "birth")
                  {
                    person.birth = itemDataList[n].when.source.datestring.substr(0, itemDataList[n].when.source.datestring.indexOf(" ")).replace(/(-XX)/g, "");
                  }
                  else if (itemDataList[n].type === "death")
                  {
                    person.death = itemDataList[n].when.source.datestring.substr(0, itemDataList[n].when.source.datestring.indexOf(" ")).replace(/(-XX)/g, "");
                  }
                }
              }

              chainCallback();
            });
          });

          chain.final(function(error)
          {
            if (error)
            {
              callbackPerson(error);
              return;
            }

            person.parents.sort(function(a, b)
            {
              if (a.gender === b.gender)
              {
                return 0;
              }
              else if (a.gender === "m")
              {
                return 1;
              }
              else if (a.gender === "f")
              {
                return -1;
              }

              return 0;
            });

            person.children.sort(function(a, b)
            {
              if (a.birth === b.birth)
              {
                return 0;
              }
              else if (a.birth === false)
              {
                return -1;
              }
              else if (b.birth === false)
              {
                return 1;
              }

              return parseInt(murrix.utils.rpad(a.birth.replace(/-/g, ""), "0", 8), 10) - parseInt(murrix.utils.rpad(b.birth.replace(/-/g, ""), "0", 8), 10);
            });

            callbackPerson(null, person);
          });

          chain.run();
        });
      };

      createPerson("me", args.nodeId, function(error, person)
      {
        callback(error, { count: count, tree: person });
      });
    });

    murrix.client.register("helper_nodeGetFilesList", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.getItemQuery(session, nodeData, [ "file" ], function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var options = { collection: "items", fields: { _id: true, tagSearch: true, name: true, when: true, cacheId: true, "exif.MIMEType": true } };

          murrix.db.findWithRights(session, query, options, function(error, itemDataList)
          {
            if (error)
            {
              callback(error);
              return;
            }

            var list = [];

            itemDataList.sort(murrix.utils.sortItemFunction);

            for (var n = 0; n < itemDataList.length; n++)
            {
              list.push({ _id: itemDataList[n]._id, name: itemDataList[n].name, cacheId: itemDataList[n].cacheId, type: itemDataList[n].exif ? itemDataList[n].exif.MIMEType : null });
            }

            callback(null, list);
          });
        });
      });
    });

    murrix.client.register("helper_nodeGetTimelineList", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.getItemQuery(session, nodeData, [ "file", "text" ], function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var options = { collection: "items", fields: { _id: true, tagSearch: true, when: true, what: true, where: true, name: true, text: true, cacheId: true, "exif.MIMEType": true } };

          murrix.db.findWithRights(session, query, options, function(error, itemDataList)
          {
            if (error)
            {
              callback(error);
              return;
            }

            var results = {};
            var timeline = [];

            for (var n = 0; n < itemDataList.length; n++)
            {
              var itemData = itemDataList[n];

              var datestamp = false;
              var datestampCompare = 0;

              if (itemData.when === false || itemData.when === null || itemData.when.timestamp === false || itemData.when.timestamp === null)
              {
                datestamp = false;
              }
              else
              {
                var timestamp = moment.utc(itemData.when.timestamp * 1000).local();
                datestamp = [ timestamp.year(), timestamp.month(), timestamp.date() ];

                var datestampString = murrix.utils.lpad(datestamp[0] + "", "0", 4);
                datestampString += murrix.utils.lpad(datestamp[1] + "", "0", 2);
                datestampString += murrix.utils.lpad(datestamp[2] + "", "0", 2);
                datestampCompare = parseInt(datestampString, 10);
              }

              if (!results[datestampCompare])
              {
                results[datestampCompare] = {};
                results[datestampCompare].datestamp = datestamp;
                results[datestampCompare].texts = [];
                results[datestampCompare].audio = [];
                results[datestampCompare].images = [];
              }

              if (itemData.what === "text")
              {
                results[datestampCompare].texts.push({ _id: itemData._id, name: itemData.name, type: itemData.type, when: itemData.when, text: itemData.text, _who: itemData._who, where: itemData.where });
              }
              else if (itemData.what === "file")
              {
                if (murrix.utils.mimeIsImage(itemData.exif.MIMEType) || murrix.utils.mimeIsVideo(itemData.exif.MIMEType))
                {
                  results[datestampCompare].images.push({ _id: itemData._id, name: itemData.name, cacheId: itemData.cacheId, type: itemData.exif ? itemData.exif.MIMEType : null });
                }
                else if (murrix.utils.mimeIsAudio(itemData.exif.MIMEType))
                {
                  results[datestampCompare].audio.push({ _id: itemData._id, name: itemData.name, type: itemData.exif ? itemData.exif.MIMEType : null });
                }
              }
            }

            for (var key in results)
            {
              var item = {};

              item.datestampCompare = key;
              item.datestamp = results[key].datestamp;
              item.texts = results[key].texts;
              item.images = results[key].images;
              item.audio = results[key].audio;

              item.texts.sort(murrix.utils.sortItemFunction);
              item.images.sort(murrix.utils.sortItemFunction);
              item.audio.sort(murrix.utils.sortItemFunction);

              timeline.push(item);
            }

            timeline.sort(function(a, b)
            {
              return a.datestampCompare - b.datestampCompare;
            });

            callback(null, timeline);
          });
        });
      });
    });

    murrix.client.register("helper_nodeToolsRemoveDuplicates", function(session, args, callback)
    {
      var options = { collection: "items" };

      var chain = new MurrixChain();

      for (var n = 0; n < args.list.length; n++)
      {
        chain.add(args.list[n], function(itemData, chainOptions, chainCallback)
        {
          murrix.db.items.remove(session, itemData._id, function(error)
          {
            if (error)
            {
              chainCallback("Failed to remove item, reason: " + error);
              return;
            }

            chainCallback();
          });
        });
      }

      chain.final(function(error, options)
      {
        if (error)
        {
          murrix.logger.error(self.name, error);
          callback(error);
          return;
        }

        callback(null);
      });

      chain.run();
    });

    murrix.client.register("helper_nodeToolsGetDuplicateList", function(session, args, callback)
    {
      var options = { collection: "items", fields: { _id: true, name: true, "checksum": true } };

      murrix.db.findWithRights(session, { _parents: args.nodeId, what: "file" }, options, function(error, itemDataList)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not find the requested files to compile duplicate list, reason: " + error);
          callback("Could not find the requested files to compile duplicate list, reason: " + error);
          return;
        }

        var duplicates = [];
        var nonDuplicates = {};

        for (var n = 0; n < itemDataList.length; n++)
        {
          var itemData = itemDataList[n];

          if (!itemData.checksum || itemData.checksum === false || itemData.checksum === "")
          {
            murrix.logger.error(self.name, "Found item without checksum!");
            murrix.logger.debug(self.name, JSON.stringify(itemData));
            continue;
          }

          if (nonDuplicates[itemData.checksum])
          {
            itemData.original = nonDuplicates[itemData.checksum];
            duplicates.push(itemData);
          }
          else
          {
            nonDuplicates[itemData.checksum] = itemData;
          }
        }

        callback(null, duplicates);
      });
    });

    murrix.client.register("helper_nodeToolsHideRaw", function(session, args, callback)
    {
      var chain = new MurrixChain();

      for (var n = 0; n < args.list.length; n++)
      {
        chain.add(args.list[n], function(itemDataRaw, chainOptions, chainCallback)
        {
          murrix.db.findOne({ _id: itemDataRaw.parent._id }, "items", function(error, itemData)
          {
            if (error)
            {
              chainCallback(error);
              return;
            }

            itemData.versions = itemData.versions || [];
            itemData.versions.push({ id: itemDataRaw._id, name: itemDataRaw.name, size: itemDataRaw.exif.FileSize });

            murrix.logger.info(self.name, "Adding raw version to " + itemData.name + ", id " + itemData._id);
            murrix.logger.debug(self.name, JSON.stringify(itemData.versions));

            murrix.db.items.save(session, itemData, function(error, itemDataNew)
            {
              if (error)
              {
                chainCallback(error);
                return;
              }

              murrix.db.mongoDb.collection("items", function(error, collection)
              {
                if (error)
                {
                  chainCallback(error);
                  return;
                }

                collection.remove({ _id: itemDataRaw._id }, function(error, removed)
                {
                  if (error)
                  {
                    chainCallback(error);
                    return;
                  }

                  chainOptions.itemDataList.push(itemDataNew);

                  chainCallback();
                });
              });
            });
          });
        });
      }

      chain.final(function(error, options)
      {
        if (error)
        {
          murrix.logger.error(self.name, error);
          callback(error);
          return;
        }

        callback(null, options.itemDataList);
      });

      chain.run({ itemDataList: [] });
    });

    murrix.client.register("helper_nodeToolsGetHideRawList", function(session, args, callback)
    {
      var options = { collection: "items", fields: { _id: true, name: true, "exif.FileSize": true } };

      murrix.db.findWithRights(session, { _parents: args.nodeId, what: "file", "exif.MIMEType": { $in: murrix.utils.rawImageMimeTypes } }, options, function(error, itemDataList)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not find the requested files to compile raw list, reason: " + error);
          callback("Could not find the requested files to compile raw list, reason: " + error);
          return;
        }

        var chain = new MurrixChain();

        for (var n = 0; n < itemDataList.length; n++)
        {
          chain.add(itemDataList[n], function(itemDataRaw, chainOptions, chainCallback)
          {
            var name = path.basename(itemDataRaw.name, path.extname(itemDataRaw.name));
            var query = {};

            query.$and = [ { name: { $regex: "^" + name + "[.]", $options: "-i" } }, { name: { $ne: itemDataRaw.name } } ];
            query._parents = itemDataRaw._parents;

            murrix.db.findOne(query, options, function(error, itemData)
            {
              if (error)
              {
                chainCallback(error);
                return;
              }

              if (!itemData)
              {
                murrix.logger.debug(self.name, "Found nowhere to hide " + itemDataRaw.name + ", id " + itemDataRaw._id);

                chainOptions.cannotHideList.push(itemDataRaw);

                chainCallback(null);
                return;
              }

              itemDataRaw.parent = itemData;
              chainOptions.canHideList.push(itemDataRaw);
              chainCallback();
            });
          });
        }

        chain.final(function(error, chainOptions)
        {
          if (error)
          {
            murrix.logger.error(self.name, error);
            callback(error);
            return;
          }

          callback(null, chainOptions.cannotHideList, chainOptions.canHideList);
        });

        chain.run({ cannotHideList: [], canHideList: [] });
      });
    });

    murrix.client.register("helper_nodeToolsSetCamera", function(session, args, callback)
    {
      var options = { collection: "items" };

      murrix.db.findWithRights(session, { _id: { $in: args._itemIds } }, options, function(error, itemDataList)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var chain = new MurrixChain();

        for (var n = 0; n < itemDataList.length; n++)
        {
          itemDataList[n]._with = args._with;

          chain.add(itemDataList[n], function(itemData, options, chainCallback)
          {
            murrix.db.items.save(session, itemData, function(error, itemData)
            {
              if (error)
              {
                chainCallback("Failed to save item, reason: " + error);
                return;
              }

              options.itemDataList.push(itemData);

              chainCallback();
            });
          });
        }

        chain.final(function(error, options)
        {
          if (error)
          {
            murrix.logger.error(self.name, error);
            callback(error);
            return;
          }

          callback(null, options.itemDataList);
        });

        chain.run({ itemDataList: [] });
      });
    });

    murrix.client.register("helper_nodeToolsGetCameraList", function(session, args, callback)
    {
      var options = { collection: "items", fields: { _id: true, exif: true } };

      murrix.db.findWithRights(session, { _parents: args.nodeId, what: "file" }, options, function(error, itemDataList)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not find the requested files to compile camera list, reason: " + error);
          callback("Could not find the requested files to compile camera list, reason: " + error);
          return;
        }

        var itemList = [];
        var identifiers = {};

        for (var n = 0; n < itemDataList.length; n++)
        {
          var item = itemDataList[n];
          var identifier = { _itemIds: [], type: "none", unique: "", _with: false, withName: "" };

          if (item.exif.Model)
          {
            identifier.type = "name";
            identifier.unique = item.exif.Model;
            identifier.withName = item.exif.Model;
          }

          if (item.exif.SerialNumber)
          {
            identifier.type = "serial";
            identifier.unique = item.exif.SerialNumber;
          }

          var identifierKey = identifier.type + "_" + identifier.unique;

          if (!identifiers[identifierKey])
          {
            identifiers[identifierKey] = identifier;
          }

          identifiers[identifierKey]._itemIds.push(item._id);
        }

        identifiers = murrix.utils.makeArray(identifiers);

        var query = {};

        query.type = "camera";
        query.$or = [];

        for (var n = 0; n < identifiers.length; n++)
        {
          if (identifiers[n].type === "serial")
          {
            query.$or.push({ serial: identifiers[n].unique });
          }
          else if (identifiers[n].type === "name")
          {
            query.$or.push({ name: identifiers[n].unique });
          }
        }

        if (query.$or.length === 0)
        {
          callback(null, identifiers);
          return;
        }

        var options = { collection: "nodes", fields: { _id: true, name: true, serial: true } };

        murrix.db.findWithRights(session, query, options, function(error, nodeDataList)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Could not find the requested cameras to compile a list, reason: " + error);
            callback("Could not find the requested cameras to compile a list, reason: " + error);
            return;
          }

          for (var n = 0; n < nodeDataList.length; n++)
          {
            var node = nodeDataList[n];

            var identifierSerial = { type: "serial", unique: node.serial ? node.serial : "" };
            var identifierName = { type: "name", unique: node.name };

            for (var i = 0; i < identifiers.length; i++)
            {
              if ((identifiers[i].type === identifierSerial.type && identifiers[i].unique === identifierSerial.unique) ||
                  (identifiers[i].type === identifierName.type && identifiers[i].unique === identifierName.unique))
              {
                identifiers[i]._with = node._id;
              }
            }
          }

          callback(null, identifiers);
        });
      });
    });

    murrix.client.register("helper_itemGetEnvironment", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.getItemQuery(session, nodeData, [ "file", "text" ], function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var options = { collection: "items", fields: { _id: true, tagSearch: true, when: true, name: true } };

          murrix.db.findWithRights(session, query, options, function(error, itemDataList)
          {
            if (error)
            {
              callback(error);
              return;
            }

            var environment = {};
            environment.count = itemDataList.length;
            environment.index = 0;
            environment.prevId = args.itemId;
            environment.nextId = args.itemId;

            itemDataList.sort(murrix.utils.sortItemFunction);

            for (var n = 0; n < itemDataList.length; n++)
            {
              if (itemDataList[n]._id === args.itemId)
              {
                environment.index = n + 1;
                environment.prevId = itemDataList[n - 1 < 0 ? itemDataList.length - 1 : n - 1]._id;
                environment.nextId = itemDataList[n + 1 >= itemDataList.length ? 0 : n + 1]._id;
                break;
              }
            }

            callback(null, environment);
          });
        });
      });
    });

    murrix.client.register("helper_nodeGetShowingSuggestions", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.getItemQuery(session, nodeData, [ "file", "text" ], function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var options = { collection: "items", fields: { "showing._id": true } };

          murrix.db.findWithRights(session, query, options, function(error, itemDataList)
          {
            if (error)
            {
              callback(error);
              return;
            }

            var list = [];

            for (var n = 0; n < itemDataList.length; n++)
            {
              if (itemDataList[n].showing)
              {
                for (var i = 0; i < itemDataList[n].showing.length; i++)
                {
                  if (!murrix.utils.inArray(itemDataList[n].showing[i]._id, list))
                  {
                    list.push(itemDataList[n].showing[i]._id);
                  }
                }
              }
            }

            callback(null, list);
          });
        });
      });
    });

    murrix.client.register("helper_nodeGetWhoSuggestions", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.getItemQuery(session, nodeData, [ "file", "text" ], function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var options = { collection: "items", fields: { "_who": true } };

          murrix.db.findWithRights(session, query, options, function(error, itemDataList)
          {
            if (error)
            {
              callback(error);
              return;
            }

            var list = [];

            for (var n = 0; n < itemDataList.length; n++)
            {
              if (itemDataList[n]._who)
              {
                if (!murrix.utils.inArray(itemDataList[n]._who, list))
                {
                  list.push(itemDataList[n]._who);
                }
              }
            }

            callback(null, list);
          });
        });
      });
    });

    murrix.client.register("helper_nodeGetWithSuggestions", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.getItemQuery(session, nodeData, [ "file", "text" ], function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var options = { collection: "items", fields: { "_with": true } };

          murrix.db.findWithRights(session, query, options, function(error, itemDataList)
          {
            if (error)
            {
              callback(error);
              return;
            }

            var list = [];

            for (var n = 0; n < itemDataList.length; n++)
            {
              if (itemDataList[n]._with)
              {
                if (!murrix.utils.inArray(itemDataList[n]._with, list))
                {
                  list.push(itemDataList[n]._with);
                }
              }
            }

            callback(null, list);
          });
        });
      });
    });

    murrix.client.register("helper_nodeGetWhereSuggestions", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.getItemQuery(session, nodeData, [ "file", "text" ], function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var options = { collection: "items", fields: { "where._id": true } };

          murrix.db.findWithRights(session, query, options, function(error, itemDataList)
          {
            if (error)
            {
              callback(error);
              return;
            }

            var list = [];

            for (var n = 0; n < itemDataList.length; n++)
            {
              if (itemDataList[n].where && itemDataList[n].where._id)
              {
                if (!murrix.utils.inArray(itemDataList[n].where._id, list))
                {
                  list.push(itemDataList[n].where._id);
                }
              }
            }

            callback(null, list);
          });
        });
      });
    });

    murrix.client.register("helper_nodeGetMapMarkers", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        self.getItemQuery(session, nodeData, [ "file", "text", "position" ], function(error, query)
        {
          if (error)
          {
            callback(error);
            return;
          }

          query.track = { "$ne" : true };

          var options = { collection: "items", fields: { _id: true, tagSearch: true, when: true, where: true, name: true, track: true } };

          murrix.db.findWithRights(session, query, options, function(error, itemDataList)
          {
            if (error)
            {
              callback(error);
              return;
            }

            var list = [];

            itemDataList.sort(murrix.utils.sortItemFunction);

            for (var n = 0; n < itemDataList.length; n++)
            {
              if (itemDataList[n].where && itemDataList[n].where.latitude)
              {
                list.push({ _id: itemDataList[n]._id, name: itemDataList[n].name, when: itemDataList[n].when, where: itemDataList[n].where });
              }
            }

            callback(null, list);
          });
        });
      });
    });

    murrix.client.register("helper_nodeGetMapTrackedInfo", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOne({ _id: args._id }, options, function(error, deviceNodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        if (deviceNodeData && deviceNodeData._owners && deviceNodeData._owners.length > 0)
        {
          murrix.db.findOne({ _id: deviceNodeData._owners[0] }, options, function(error, ownerNodeData)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, { deviceName: deviceNodeData.name, ownerName: ownerNodeData.name });
          });
        }
      });
    });

    murrix.client.register("helper_nodeGetMapTracks", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true, type: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          console.log("a", error);
          callback(error);
          return;
        }

        self.getItemQuery(session, nodeData, [ "position" ], function(error, query)
        {
          if (error)
          {
            console.log("b", error);
            callback(error);
            return;
          }

          query.track = true;

          if (args.lastTimestamp)
          {
            query["when.timestamp"] = { $gt: args.lastTimestamp };
          }

          var options = { limit: args.limit, collection: "items", fields: { _id: true, when: true, where: true, _with: true } };
          console.log(query, options);
          murrix.db.findWithRights(session, query, options, function(error, itemDataList)
          {
            if (error)
            {
              console.log(error);
              console.log("c", error);
              callback(error);
              return;
            }

            var list = [];

            itemDataList.sort(murrix.utils.sortItemFunction);

            for (var n = 0; n < itemDataList.length; n++)
            {
              list.push({ _id: itemDataList[n]._id, _with: itemDataList[n]._with, when: itemDataList[n].when, where: itemDataList[n].where });
            }

            callback(null, list);
          });
        });
      });
    });

    murrix.client.register("helper_nodeGetAge", function(session, args, callback)
    {
      var options = { collection: "nodes", fields: { _id: true, tagSearch: true } };

      murrix.db.findOneWithRights(session, { _id: args.nodeId }, options, function(error, nodeData)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var query = { $or: [] };
        query.what = "text";
        query._parents = args.nodeId;
        query.$or.push({ type: "birth" });
        query.$or.push({ type: "death" });

        var options = { collection: "items", fields: { _id: true, tagSearch: true, when: true, type: true } };

        murrix.db.findWithRights(session, query, options, function(error, itemDataList)
        {
          if (error)
          {
            callback(error);
            return;
          }

          var age = { ageNow: false, ageAtDeath: false };
          var birthItem = false;
          var deathItem = false;

          for (var n = 0; n < itemDataList.length; n++)
          {
            if (itemDataList[n].type === "birth")
            {
              birthItem = itemDataList[n];
            }
            else if (itemDataList[n].type === "death")
            {
              deathItem = itemDataList[n];
            }
          }

          if (birthItem && birthItem.when && birthItem.when.timestamp)
          {
            age.ageNow = murrix.utils.calculateAge(birthItem.when.timestamp);
            age.birthTimestamp = birthItem.when.timestamp;

            if (deathItem && deathItem.when && deathItem.when.timestamp)
            {
              age.ageAtDeath = murrix.utils.calculateAge(birthItem.when.timestamp, deathItem.when.timestamp);
              age.deathTimestamp = deathItem.when.timestamp;
            }
          }

          callback(null, age);
        });
      });
    });

    self.emit("done");
  });

  self.getItemQuery = function(session, nodeData, itemTypes, callback)
  {
    var query = { $or: [] };

    query.what = { $in : itemTypes };
    query.$or.push({ _parents: nodeData._id });

    if (nodeData.type === "person")
    {
      query.$or.push({ "showing._id": nodeData._id });
    }
    else if (nodeData.type === "location")
    {
      query.$or.push({ "showing._id": nodeData._id });
      query.$or.push({ "where._id": nodeData._id });
    }
    else if (nodeData.type === "camera")
    {
      query.$or.push({ "showing._id": nodeData._id });
      query.$or.push({ "_with": nodeData._id });
    }
    else if (nodeData.type === "vehicle")
    {
      query.$or.push({ "showing._id": nodeData._id });
    }
    else if (nodeData.type === "tags")
    {
      query.what = { $in : [ "file"] };

      var options = { collection: "nodes", fields: { _id: true } };

      murrix.db.findWithRights(session, { tags: { $in: nodeData.tagSearch } }, options, function(error, nodeDataList)
      {
        if (error)
        {
          console.log(error);
          callback(error);
          return;
        }

        var idList = [];

        idList.push(nodeData._id);

        for (var n = 0; n < nodeDataList.length; n++)
        {
          idList.push(nodeDataList[n]._id);
        }

        query.$or = [];
        query.$or.push({ _parents: { $in: idList } });

        callback(null, query);
      });

      return;
    }

    callback(null, query);
  };
}

util.inherits(MurrixHelpersManager, events.EventEmitter);

exports.Manager = MurrixHelpersManager;
