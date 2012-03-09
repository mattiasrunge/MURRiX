
$(function()
{
  $.murrix.libs.wizard = function(wizard)
  {
    var parent_       = this;
    this.step_        = 0;
    this.wizard_      = wizard;
    this.properties_  = {};
    this.container_   = null;
    
    this.start = function()
    {
      parent_.properties_ = {}
      parent_.step_       = 0;
      parent_.container_  = null;
      parent_.wizard_[parent_.step_]["init"](parent_, parent_.properties_)
    }
    
    this.next = function()
    {
      if (null == parent_.wizard_[parent_.step_]["validate"] || parent_.wizard_[parent_.step_]["validate"](parent_, parent_.properties_))
      {
        parent_.container_.dialog("disable");
        
        if (parent_.step_ < parent_.wizard_.length - 1)
        {
          parent_.step_++;
          parent_.wizard_[parent_.step_]["init"](parent_, parent_.properties_);
        }
        else
        {
          parent_.container_.dialog("close");
          parent_.container_ = null;
        }
      }
      else
      {
        alert("Form validation failed, have you filled in all the fields?")
      }
    }
    
    this.previous = function()
    {
      parent_.container_.dialog("disable");
      parent_.step_--;
      parent_.wizard_[parent_.step_]["init"](parent_, parent_.properties_)
    }

    this.show = function(container)
    {
      var buttons   = {};
      
      if (parent_.container_)
      {
        parent_.container_.dialog("close");
        parent_.container_ = null;
      }
      
      parent_.container_ = container;
      
      if (parent_.step_ > 0 && parent_.step_ < parent_.wizard_.length - 1)
      {
        buttons["Previous"] = parent_.previous;
      }

      if (parent_.wizard_[parent_.step_]["validate"] && parent_.step_ < parent_.wizard_.length - 2)
      {
        buttons["Next"] = parent_.next;
      }
    
      if (parent_.wizard_[parent_.step_]["validate"] && parent_.step_ == parent_.wizard_.length - 2)
      {
        buttons["Finish"] = parent_.next;
      }
      
      if (parent_.step_ == parent_.wizard_.length - 1)
      {
        buttons["Close"] = function()
        {
          parent_.container_.dialog("close");
          parent_.container_ = null;
        }
      }
      
      parent_.container_.dialog(
      {
        "autoOpen"  : true,
        "width"     : 800,
        "modal"     : true,
        "draggable" : false,
        "resizable" : false,
        "show"      : "fade",
        "buttons"   : buttons
      });
    }
  }
  
})
