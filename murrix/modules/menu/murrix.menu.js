
$(function()
{
  $.murrix.module.menu = new function()
  {
    /* Class variable declaration */
    this.container_     = null;
    this.handles_       = {};
    this.columns_       = [];
    this.active_handle_ = null;
    
   
    /* Private methods */
    
    this._addHandle = function(name, color, show_callback)
    {
      var self = this;
      
      var position_right = 110 * (Object.keys(self.handles_).length + 1);
      
      var handle = $($("#murrix-menu-handle").render({ "name" : name }, { "link" : false }));
      
      handle.addClass("murrix-menu-color-" + color);
      handle.css({ "right" : position_right });
      
      handle.on("click", function(event)
      {
        if (!self.active_handle_) // Nothing visible
        {
          self.container_.animate({ "top" : 0 });
          
          self._hideColumns(true);
          
          self.active_handle_ = handle;
          
          show_callback(true, name, color);
        }
        else if (handle == self.active_handle_) // Same visible
        {
          self.container_.animate({ "top" : -195 }, function()
          {
            self._hideColumns(true);
          });
          
          self.active_handle_ = null;
        }
        else // Other should be visible
        {
          self.container_.animate({ "top" : 0 });
          
          self._hideColumns(false);
          
          self.active_handle_ = handle;

          show_callback(false, name, color);
        }
      });
      
      
      handle.appendTo(this.container_);
      
      this.handles_[name] = handle;
    }
    
    this._hideColumns = function(imidiate)
    {
      for (index = 0; index < this.columns_.length; index++)
      {
        this._hideColumn(imidiate, index);
      }
    }
    
    this._isColumnVisible = function(index)
    {
      return this.columns_[index].position().top == 0;
    }
    
    this._hideColumn = function(imidiate, index)
    {
      var self = this;
      
      if (imidiate)
      {
        this.columns_[index].css({ "top" : -180 });
        self._checkLastColumn();
      }
      else
      {
        this.columns_[index].animate({ "top" : -180 }, "fast", "swing", function(event)
        {
          self._checkLastColumn();
        });
      }
    }
    
    this._checkLastColumn = function()
    {
      var self = this;
      var last_column_index = this.columns_.length;
      
      for (index = 0; index < this.columns_.length; index++)
      {
        self.columns_[index].css({ "border-width-right" : "", "width" : "" });

        if (index < last_column_index && !self._isColumnVisible(index))
        {
          last_column_index = index - 1;
        }
      }
      
      if (last_column_index > 0 && last_column_index < this.columns_.length)
      {
        this.columns_[last_column_index].css({ "border-right-width" : 0, "width" : 800 });
      }
    }
    
    this._showColumn = function(imidiate, index, html_or_element)
    {
      var self = this;
      
      if (imidiate)
      {
        if (typeof html_or_element == "string")
        {
          this.columns_[index].html(html_or_element);
        }
        else
        {
          this.columns_[index].empty();
          html_or_element.appendTo(this.columns_[index]);
        }
        
        this.columns_[index].css({ "top" : 0 });
        self._checkLastColumn();
      }
      else if (this._isColumnVisible(index)) // Visible
      {
        this.columns_[index].animate({ "top" : -180 }, "fast", "swing", function(event)
        {
          if (typeof html_or_element == "string")
          {
            self.columns_[index].html(html_or_element);
          }
          else
          {
            self.columns_[index].empty();
            html_or_element.appendTo(self.columns_[index]);
          }
          
          self.columns_[index].animate({ "top" : 0 }, "fast", "swing", function(event)
          {
            self._checkLastColumn();
          });
          
          self._checkLastColumn();          
        });
      }
      else
      {
        if (typeof html_or_element == "string")
        {
          this.columns_[index].html(html_or_element);
        }
        else
        {
          this.columns_[index].empty();
          html_or_element.appendTo(this.columns_[index]);
        }
        
        this.columns_[index].animate({ "top" : 0 }, "fast", "swing", function(event)
        {
          self._checkLastColumn();
        });
      }
    }
    
    this._showColumnAccountUser = function(index, result_code, user_node_data)
    {
      var self = this;
      
      if (MURRIX_RESULT_CODE_OK == result_code)
      {
        if (null == user_node_data || user_node_data.attributes.Username == $.murrix.module.user.getDefaultUsername())
        {
          // Sign in form
          var container = $($("#murrix-menu-account-user").render({}, { "link" : false }));
          
          container.on("submit", function(event)
          {
            event.preventDefault();
            
            self._hideColumn(false, index);
              
            $.murrix.module.user.login($(container.find("#murrix-menu-account-form-username")).val(), $(container.find("#murrix-menu-account-form-password")).val(), function(transaction_id, result_code, user_node_data)
            {
              self._showColumnAccountUser(index, result_code, user_node_data);
            });
          });
          
          this._showColumn(false, index, container);
        }
        else
        {
          // Sign out form
          var container = $($("#murrix-menu-account-user").render({ "user" : user_node_data }, { "link" : false }));
          
          container.on("submit", function(event)
          {
            event.preventDefault();
            
            self._hideColumn(false, index);
            
            $.murrix.module.user.logout(function(transaction_id, result_code, user_node_data)
            {
              self._showColumnAccountUser(index, result_code, user_node_data);
            });
          });
          
          this._showColumn(false, index, container);
        }
      }
      else
      {
        // Failed form
        var container = $($("#murrix-menu-account-user").render({ "result_code" : result_code }, { "link" : false }));
        
        container.on("submit", function(event)
        {
          event.preventDefault();
          
          self._hideColumn(false, index);
          
          self._showColumnAccountUser(index, MURRIX_RESULT_CODE_OK, null);
        });
        
        this._showColumn(false, index, container);
      }
    }
    
    this._showColumnSearch = function(index)
    {
      var self = this;
      
      var container = $($("#murrix-menu-search-form").render({}, { "link" : false }));
      
      container.on("submit", function(event)
      {
        event.preventDefault();
        
        self._hideColumn(false, index + 1);
        
        var name = "%" + $(container.find("#murrix-menu-search-form-query")).val() + "%";
        
        $.murrix.module.db.searchNodes({ "name" : name, "attributes" : name } , function(transaction_id, result_code, node_list)
        {
          var element = $($("#murrix-menu-search-result").render({ "node_list" : $.murrix.makeArray(node_list) }, { "link" : false }));
          
          self._showColumn(false, index + 1, element);
        });
      });
      
      this._showColumn(false, index, container);
    }

    
    /* Public methods */
    
    this.show = function()
    {
      var self = this;
      
      this.container_ = $($("#murrix-menu-container").render({ "columns" : 8 }, { "link" : false }));
      
      this.container_.appendTo($("body"));

      jQuery.each(this.container_.find(".murrix-menu-column"), function(n, column)
      {
        self.columns_.push($(column));
      });
      
      
      this._hideColumns(true);
      
      
      
      this._addHandle("account", "red", function(imidiate, name, color)
      {
        jQuery.each(self.columns_, function(index, column)
        {
          switch (index)
          {
            case 0:
            {
              self._showColumn(imidiate, index, $("#murrix-menu-title").render({ "name" : name, "color" : color }));
              
              break;
            }
            case 1:
            {
              $.murrix.module.user.getUser(function(transaction_id, result_code, user_node_data)
              {
                self._showColumnAccountUser(index, result_code, user_node_data);
              });
              
              break;
            }
          }
          
        });
        
        
      });
      
      this._addHandle("search", "green", function(imidiate, name, color)
      {
        jQuery.each(self.columns_, function(index, column)
        {
          switch (index)
          {
            case 0:
            {
              self._showColumn(imidiate, index, $("#murrix-menu-title").render({ "name" : name, "color" : color }));
              
              break;
            }
            case 1:
            {
              self._showColumnSearch(index);
              
              break;
            }
          }
          
        });
        
        
      });
      
      
      this._addHandle("menu", "blue", function(imidiate, name, color)
      {
        jQuery.each(self.columns_, function(index, column)
        {
          switch (index)
          {
            case 0:
            {
              self._showColumn(imidiate, index, $("#murrix-menu-title").render({ "name" : name, "color" : color }));
              
              break;
            }
          }
          
        });
        
        
      });
      
      

    }
  }
  
  $.murrix.module.menu.wizard = {};
  
  $.murrix.module.menu.show();
})
