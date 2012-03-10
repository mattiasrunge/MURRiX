
$(function()
{
  $.murrix.module.menu = new function()
  {
    /* Class variable declaration */
    var parent_     = this;
    
    this.visible_   = false;
    this.container_ = null;
    this.menus_     = {};
    this.menuCount_ = 0;
    
   
    /* Private methods */
    this._addMenu = function(name, color)
    {
      var right = 110 * (parent_.menuCount_ + 1);
      var handle = $("<div>" + name + "</div>");
      var container = $($("#murrix-menu-" + name).render({ "color" : color }, { "link" : false }));
      
      container.addClass("murrix-menu-container-content");
      container.addClass("murrix-menu-color-" + color);
      
      container.appendTo(parent_.container_);
      
      container.hide();
      
      
      handle.addClass("murrix-menu-handle");
      handle.addClass("murrix-menu-color-" + color);
      
      handle.appendTo(this.container_);
      
      handle.css({ "right" : right });
      
      handle.on("click", function(event)
      {
        if (container.is(":visible"))
        {
          parent_.container_.animate({ "top" : -195 }, function()
          {
            container.hide();
          });
        }
        else
        {
          parent_.container_.animate({ "top" : 0 });
          
          if ($(".murrix-menu-container-content:visible").length > 0)
          {
            $(".murrix-menu-container-content:visible").fadeOut()
          }

          container.fadeIn();
        }
        
        this.visible_ = !this.visible_;        
      });
      
      parent_.menus_[name] = container;
      parent_.menuCount_++;
    }
    
    this._renderAccountUser = function(result_code, user_node_data)
    {
      if (MURRIX_RESULT_CODE_OK == result_code)
      {
        if (null == user_node_data || user_node_data.attributes.Username == $.murrix.module.user.getDefaultUsername())
        {
          // Sign in form
          
          $(".murrix-menu-account-user").animate({ "top" : -180 }, function(event)
          {
            $(".murrix-menu-account-user").html($("#murrix-menu-account-user").render({}));
            $(".murrix-menu-account-user").animate({ "top" : 0 });
            
            $(".murrix-menu-account-form").on("submit", function(event)
            {
              event.preventDefault();
              
              $.murrix.module.user.login($("#murrix-menu-account-form-username").val(), $("#murrix-menu-account-form-password").val(), function(transaction_id, result_code, user_node_data)
              {
                parent_._renderAccountUser(result_code, user_node_data);
              });
            });
          });
        }
        else
        {
          // Sign out form
          
          $(".murrix-menu-account-user").animate({ "top" : -180 }, function(event)
          {
            $(".murrix-menu-account-user").html($("#murrix-menu-account-user").render({ "user" : user_node_data }));
            $(".murrix-menu-account-user").animate({ "top" : 0 });
            
            $(".murrix-menu-account-form").on("submit", function(event)
            {
              event.preventDefault();
              
              $.murrix.module.user.logout(function(transaction_id, result_code, user_node_data)
              {
                parent_._renderAccountUser(result_code, user_node_data);
              });
            });
          });
        }
      }
      else
      {
        // Failed form
        
        $(".murrix-menu-account-user").animate({ "top" : -180 }, function(event)
        {
          $(".murrix-menu-account-user").html($("#murrix-menu-account-user").render({ "result_code" : result_code }));
          $(".murrix-menu-account-user").animate({ "top" : 0 });
          
          $(".murrix-menu-account-form").on("submit", function(event)
          {
            event.preventDefault();
            
            parent_._renderAccountUser(MURRIX_RESULT_CODE_OK, null);
          });
        });
      }
    }
    
    
    /* Public methods */
    
    this.show = function()
    {
      parent_.container_ = $("<div></div>");
      
      parent_.container_.addClass("murrix-menu-container");
      
      parent_.container_.appendTo($("body"));
      
      
      parent_._addMenu("search", "green");
      parent_._addMenu("account", "red");
      parent_._addMenu("menu", "blue");
            
      
      $.murrix.module.user.getUser(function(transaction_id, result_code, user_node_data)
      {
        parent_._renderAccountUser(result_code, user_node_data);
      });
    }
  }
  
  $.murrix.module.menu.wizard = {};
  
  $.murrix.module.menu.show();
})
