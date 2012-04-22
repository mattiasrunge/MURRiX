
$(function()
{
  $.murrix.module.timeline = new function()
  {
    var self = this;
    
    this.bottombar_container_       = $("." + $.murrix.module_options.timeline["container"]);
    this.container_                 = null;
    this.left_scroll_element_       = null;
    this.right_scroll_element_      = null;
    this.start_marker_element_      = null;
    this.end_marker_element_        = null;
    this.menu_element_              = null;
    this.dotted_line_element_       = null;
    this.items_                     = [];
    this.total_width_               = null;
    this.item_width_                = null;
    this.left_margin_               = null;
    
    this.current_unit_              = null;
    this.start_datetime_            = null;
    this.end_datetime_              = null;
    
    
    this._getUnitTitle = function(timestamp)
    {
      if (self.current_unit_ == "years")
      {
        return moment(timestamp).format("YYYY");
      }
      else if (self.current_unit_ == "months")
      {
        return moment(timestamp).format("YYYY-MM");
      }
      else if (self.current_unit_ == "days")
      {
        return moment(timestamp).format("YYYY-MM-DD");
      }
    }

    this._getUnitWidth = function()
    {
      var test_element = $("<div class=\"timeline-unit-container\"></div>");
      
      test_element.appendTo("body");
      
      var item_width = test_element.outerWidth();
      
      test_element.remove();
      
      return item_width;
    }
    
    this._setSelection = function()
    {
      $(".timeline-unit-container").removeClass("timeline-unit-container-selected");
      
      jQuery.each(self.items_, function(n, item)
      {
        if (item.position().left >= self.start_marker_element_.position().left && item.position().left < self.end_marker_element_.position().left)
        {
          item.addClass("timeline-unit-container-selected");
        }
      });
    }

    this._createUnitItem = function(timestamp, left)
    {
      var datetime = moment(timestamp);
      
      if (self.current_unit_ == "years")
      {
        datetime.month(0).date(1).hours(0).minutes(0).seconds(0);
      }
      else if (self.current_unit_ == "months")
      {
        datetime.date(1).hours(0).minutes(0).seconds(0);
      }
      else if (self.current_unit_ == "days")
      {
        datetime.hours(0).minutes(0).seconds(0);
      }
      
      var item = $("<div class=\"timeline-unit-container\" title=\"Click to zoom in on " + self._getUnitTitle(datetime.valueOf()) + "\" data=\"" + datetime.valueOf() + "\"><div class=\"timeline-unit-container-background\"></div></div>");
      
      item.appendTo(self.container_);
      
      var title_element = $("<div class=\"timeline-unit-title\">" + self._getUnitTitle(datetime.valueOf()) + "</div>");
      
      title_element.appendTo(item);
      
      var dot_element = $("<div class=\"timeline-unit-dot\"><img class=\"timeline-unit-dot-image\" src=\"img/timeline-dot.png\"/><img class=\"timeline-unit-dot-image-selected\" src=\"img/timeline-dot-selected.png\"/></div>");
      
      dot_element.appendTo(item);
      
      item.css({"left" : left, "opacity" : 0 });
      
      //item.tipsy({ "gravity" : "s", "offset" : -20 });
      
      return item;
    }
    
    this._updateMarkersOnMove = function(left_animate)
    {
      var start_left_animate = self.start_marker_element_.position().left + left_animate;
      var end_left_animate = self.end_marker_element_.position().left + left_animate;
      var start_opactiy_animate = 1;
      var end_opactiy_animate = 1;
      
      if (start_left_animate >= self.total_width_ - self.left_margin_ || start_left_animate < self.left_margin_)
      {
        start_opactiy_animate = 0;
      }
      
      
      if (end_left_animate >= self.total_width_ - self.left_margin_ || end_left_animate < self.left_margin_)
      {
        end_opactiy_animate = 0;
      }
    
    
      
      self.start_marker_element_.animate({ "left" : start_left_animate, "opacity" : start_opactiy_animate }, function(event)
      {
        self._setSelection();
      });
      

      self.end_marker_element_.animate({ "left" : end_left_animate, "opacity" : end_opactiy_animate }, function(event)
      {
        self._setSelection();
      });
    }
    
    this._updateItemsOnMove = function(left_animate)
    {
      jQuery.each(self.items_, function(n, item)
      {
        item.animate({ "left" : item.position().left + left_animate, "opacity" : 1 });
      });
    }
    
    this._removeItemOnMove = function(left_animate, item)
    {
      item.animate({ "left" : item.position().left + left_animate, "opacity" : 0 }, function(event)
      {
        item.remove();
      });
    }
    
    this._terminateAnimations = function()
    {
      self.start_marker_element_.stop(false, true);
      self.end_marker_element_.stop(false, true);
      $(".timeline-unit-container").stop(false, true);
    }
    
    this._renderMenu = function()
    {
      self.menu_element_ = $("<div class=\"timeline-menu\"><span class=\"timeline-menu-interval\"></span></div>");
      self.menu_element_.appendTo(self.bottombar_container_);
      self.menu_element_.css("left", (self.total_width_ - self.menu_element_.outerWidth()) / 2);
      
      this._updateInterval();
    }
    
    this._updateInterval = function()
    {
      $(".timeline-menu-interval").html(self.start_datetime_.format("YYYY-MM-DD HH:mm:ss") + " to " + self.end_datetime_.format("YYYY-MM-DD HH:mm:ss"));
    }
    
    this._renderDottedLine = function()
    {
      self.dotted_line_element_ = $("<div class=\"timeline-dotted-line\"></div>");
      self.dotted_line_element_.appendTo(self.container_);
    }
    
    this.setUnit = function(unit)
    {
      self.current_unit_ = unit;
      
      self._render();
    }
    
    this.show = function(start_datetime, end_datetime, unit)
    {
      self.current_unit_    = unit;
      self.start_datetime_  = moment(new Date(start_datetime));
      self.end_datetime_    = moment(new Date(end_datetime));
      
      self._render();
    }
      
    this._render = function()
    {
      if (self.container_)
      {
        self.container_.remove();
      }
      
      if (self.menu_element_)
      {
        self.menu_element_.remove();
      }
      
      self.container_                 = null;
      self.left_scroll_element_       = null;
      self.right_scroll_element_      = null;
      self.start_marker_element_      = null;
      self.end_marker_element_        = null;
      self.menu_element_              = null;
      self.dotted_line_element_       = null;
      self.items_                     = [];
      self.total_width_               = null;
      self.item_width_                = null;
      self.left_margin_               = null;
      
      
      
      
      self.container_ = $("<div class=\"timeline-container\"></div>");
      self.container_.appendTo(self.bottombar_container_);
    
    
      self.total_width_ = self.container_.innerWidth();
      self.item_width_ = self._getUnitWidth();
    
      self._renderMenu();
    
      self._renderDottedLine();
    
    
      self.left_scroll_element_ = $("<div data=\"left\" class=\"timeline-scroll timeline-scroll-left\"><img src=\"img/timeline-scroll-left.png\"/></div>");
      self.left_scroll_element_.appendTo(self.container_);

      
      self.right_scroll_element_ = $("<div data=\"right\" class=\"timeline-scroll timeline-scroll-right\"><img src=\"img/timeline-scroll-right.png\"/></div>");
      self.right_scroll_element_.appendTo(self.container_);

      
      var total_available_width = self.total_width_ - (self.left_scroll_element_.outerWidth() + self.right_scroll_element_.outerWidth());
    
      var number_of = Math.floor(total_available_width / self.item_width_);
    
      self.left_margin_ = Math.floor((self.total_width_ - (number_of * self.item_width_)) / 2);
      
      
      
      $(".timeline-scroll").bind("click", function(event)
      {
        var item_index = self.items_.length - 1;
        var direction = 1;
      
        if ($(event.currentTarget).attr("data") == "left")
        {
          var item_index = 0;
          var direction = -1;
        }
      
      
        var data = moment(parseInt(self.items_[item_index].attr("data")));
        data.add(self.current_unit_, direction);
        
        
        var left = self.left_margin_ + ((item_index + direction) * self.item_width_);
        
      
        self._terminateAnimations();
        
        var new_item = self._createUnitItem(data, left);
        var old_item = null;
        
        if ($(event.currentTarget).attr("data") == "left")
        {
          var new_items = [ new_item ];
          self.items_ = new_items.concat(self.items_);
        
          self._setSelection();
        
          old_item = self.items_.pop();
        }
        else
        {
          self.items_.push(new_item);
          
          self._setSelection();
          
          old_item = self.items_.shift();
        }

        self._removeItemOnMove((-direction) * self.item_width_, old_item);
        
        self._updateItemsOnMove((-direction) * self.item_width_);
      
        self._updateMarkersOnMove((-direction) * self.item_width_);
      });

      
      var start_index = 0;
      var number_of_units = 0;
      
      var start_datetime = moment(self.start_datetime_);
      var end_datetime = moment(self.end_datetime_);
      
      if (self.current_unit_ == "years")
      {
        start_datetime.month(0).date(1).hours(0).minutes(0).seconds(0);
        end_datetime.month(0).date(1).hours(0).minutes(0).seconds(0);
      }
      else if (self.current_unit_ == "months")
      {
        start_datetime.date(1).hours(0).minutes(0).seconds(0);
        end_datetime.date(1).hours(0).minutes(0).seconds(0);
      }
      else if (self.current_unit_ == "days")
      {
        start_datetime.hours(0).minutes(0).seconds(0);
        end_datetime.hours(0).minutes(0).seconds(0);
      }
      
      var number_of_units = Math.floor(end_datetime.diff(start_datetime, self.current_unit_, false));

      //if (self.current_unit_ != "years")
      {
        number_of_units++;
      }
      
      start_index = Math.ceil((number_of_units - number_of) / 2);
        
      for (var n = 0; n < number_of; n++)
      {
        var datetime = moment(start_datetime);
        
        datetime.add(self.current_unit_, start_index + n);
        
        var left = self.left_margin_ + (n * self.item_width_);
        var item = self._createUnitItem(datetime.valueOf(), left);
        
        self.items_.push(item);
        
        item.animate({ "opacity" : 1 });
      }
      
        
        
      self.start_marker_element_ = $("<div class=\"timeline-marker timeline-marker-left\"></div>");
      self.start_marker_element_.appendTo(self.container_);
      self.start_marker_element_.css("left", self.left_margin_ + (self.item_width_ * (-start_index))); 
      
      
      self.end_marker_element_ = $("<div class=\"timeline-marker timeline-marker-right\"></div>");
      self.end_marker_element_.appendTo(self.container_);
      self.end_marker_element_.css("left", (self.left_margin_ + (self.item_width_ * (-start_index + number_of_units)) - self.end_marker_element_.outerWidth()));
      
      
      $(".timeline-marker").draggable({
        "axis" : "x",
        "grid" : [ 90, 0 ],
        "containment" : "parent",
        "drag" : function(event, ui)
        {
          if (ui.position.left < self.left_margin_ || ui.position.left >= self.total_width_ - self.left_margin_)
          {
            return false;
          }

          if ((self.end_marker_element_.get(0)    == event.target && ui.position.left <= self.start_marker_element_.position().left) ||
              (self.start_marker_element_.get(0)  == event.target && ui.position.left >= self.end_marker_element_.position().left))
          {
            return false;
          }
          
          
          self._setSelection();
        },
        "stop" : function(event, ui)
        {
          self._setSelection();
          
          if (self.start_marker_element_.get(0) == event.target)
          {
            var start_datetime = moment(parseInt($($(".timeline-unit-container-selected").get(0)).attr("data")));
            
            if (self.current_unit_ == "years")
            {
              start_datetime.month(0).date(1).hours(0).minutes(0).seconds(0);
            }
            else if (self.current_unit_ == "months")
            {
              start_datetime.date(1).hours(0).minutes(0).seconds(0);
            }
            else if (self.current_unit_ == "days")
            {
              start_datetime.hours(0).minutes(0).seconds(0);
            }
            
            self.start_datetime_ = start_datetime;
          }
          
          if (self.end_marker_element_.get(0) == event.target)
          {
            var end_datetime = moment(parseInt($($(".timeline-unit-container-selected").get($(".timeline-unit-container-selected").length - 1)).attr("data")));
            
            if (self.current_unit_ == "years")
            {
              end_datetime.month(0).date(1).hours(0).minutes(0).seconds(0);
            }
            else if (self.current_unit_ == "months")
            {
              end_datetime.date(1).hours(0).minutes(0).seconds(0);
            }
            else if (self.current_unit_ == "days")
            {
              end_datetime.hours(0).minutes(0).seconds(0);
            }
            
            if (self.current_unit_ != "seconds")
            {
              end_datetime.add(self.current_unit_, 1).subtract("seconds", 1);
            }
            
            self.end_datetime_ = end_datetime;
          }
          
          self._updateInterval();
        }
      });
      
            
      jQuery.each($(".timeline-marker"), function(n, marker_element)
      {
        marker_element = $(marker_element);
        
        if (marker_element.position().left >= self.total_width_ - self.left_margin_ || marker_element.position().left < self.left_margin_)
        {
          marker_element.css("opacity", 0);
        }
      });
      
      
      self._setSelection();
    }
  }
  
  //$.murrix.module.timeline.show();
})
