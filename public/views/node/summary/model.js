
var SummaryModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "summary"; });
  self.enabled = ko.observable(true);


  self.editingItem = ko.observable("");
  
  self.people = ko.observableArray([ ]);
  self.things = ko.observableArray([ ]);
  self.newAttributeName = ko.observable("");
  self.newAttributeValue = ko.observable("");

  self.attributeRemoveClicked = function()
  {
    parentModel.node().attributes.mappedRemove(this);
  };

  self.attributeEditClicked = function()
  {
    this.editing(true);
  };

  self.attributeCancelClicked = function()
  {
    this.value(this.originalValue());
    this.editing(false);
  };

  self.attributeSaveClicked = function()
  {
    this.editing(false);
    // TODO Save!
  };

  self.attributeAddClicked = function()
  {
    parentModel.node().attributes.push(new NodeAttributeMapping({ name: self.newAttributeName(), value: self.newAttributeValue() }));
    self.newAttributeName("");
    self.newAttributeValue("");
  };


  self.descriptionEditClicked = function()
  {
    parentModel.node().descriptionEditing(true);
  };

  self.descriptionCancelClicked = function()
  {
    parentModel.node().description(parentModel.node().descriptionOriginal());
    parentModel.node().descriptionEditing(false);
  };

  self.descriptionSaveClicked = function()
  {
    parentModel.node().descriptionEditing(false);
    // TODO Save!
  };


  self.nameEditClicked = function()
  {
    parentModel.node().nameEditing(true);
  };

  self.nameCancelClicked = function()
  {
    parentModel.node().name(parentModel.node().nameOriginal());
    parentModel.node().nameEditing(false);
  };

  self.nameSaveClicked = function()
  {
    parentModel.node().nameEditing(false);
    // TODO Save!
  };


  self.typeEditClicked = function()
  {
    parentModel.node().typeEditing(true);
  };

  self.typeCancelClicked = function()
  {
    parentModel.node().type(parentModel.node().typeOriginal());
    parentModel.node().typeEditing(false);
  };

  self.typeSaveClicked = function()
  {
    parentModel.node().typeEditing(false);
    // TODO Save!
  };


  self.itemClicked = function(item1, item2)
  {
    if (self.editingItem() !== "")
    {
      var parts = self.editingItem().split(".");
      console.log(self.editingItem());
      self.itemCancelClicked(parts[0], parts[1]);
    }
  
    var name = item1;

    if (item2)
    {
      name += "." + item2;
    }

    self.editingItem(name);
    
    return false;
  };

  self.itemSaveClicked = function(item1, item2)
  {
    var changed = false;

    self.editingItem("");

    var node = parentModel.node();

    if (item2)
    {
      var currentValue = "";

      for (var n = 0; n < self.attributes().length; n++)
      {
        if (item2 == self.attributes()[n].name)
        {
          currentValue = self.attributes()[n].value;
        }
      }

      changed = node[item1][item2] != currentValue;

      if (changed)
      {
        node[item1][item2] = jQuery.trim(currentValue);
      }
    }
    else
    {
      changed = node[item1] != self[item1]();

      if (changed)
      {
        node[item1] = jQuery.trim(self[item1]());
      }
    }

    if (changed)
    {
      $.murrix.module.db.updateNode(node, function(transaction_id, result_code, node)
      {
        // TODO: Check error

        parentViewModel.currentNode(node);
      });
    }
  };
  
  self.itemCancelClicked = function(item1, item2)
  {
    var changed = false;
    
    self.editingItem("");

    var node = parentModel.node();

    if (item2)
    {
      var attributes = [];
      
      for (var n = 0; n < self.attributes().length; n++)
      {
        attribute = { name: self.attributes()[n].name, value: self.attributes()[n].value };

        if (item2 == attribute.name)
        {
          attribute.value = node[item1][item2];
        }

        attributes.push(attribute);
      }

      self.attributes(attributes);
    }
    else
    {
      self[item1](node[item1]);
    }
  };
/*
  parentViewModel.currentNode.subscribe(function(node)
  {
    if (self.editingItem() != "")
    {
      var parts = self.editingItem().split(".");
      console.log(self.editingItem());
      self.itemCancelClicked(parts[0], parts[1]);
    }
    
    self.people.removeAll();
    self.things.removeAll();

    self.id("Loading...");
    self.name("");
    self.type("");
    self.description("");
    self.created("Loading...");
    self.modified("Loading...");
    self.attributes.removeAll();

    if (node === false)
    {
      return;
    }


    
    self.id(node.id);
    self.name(node.name);
    self.description(jQuery.trim(node.description));
    self.type(node.type);
    self.created(node.created);
    self.modified(node.modified);

    self.attributes.removeAll();

    jQuery.each(node.attributes, function(name, value)
    {
       self.attributes.push({ name: name, value: jQuery.trim(value) });
     });
  });*/
};
 
