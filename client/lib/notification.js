
define([
  "knockout",
  "moment"
], function(ko, moment) {
  var Notification = function() {
    this.messages = ko.observableArray();
    
    var interval = null;
    var startTimer = function() {
      if (interval) {
        return;
      }
      
      interval = setInterval(function() {
        var now = moment();
        var list = [];
        
        for (var n = 0; n < this.messages().length; n++) {
          if (now.diff(this.messages()[n].expire) < 0) {
            list.push(this.messages()[n]);
          }
        }
        
        this.messages(list);
        
        if (list.length === 0) {
          clearInterval(interval);
          interval = null;
        }
      }.bind(this), 1000);
    }.bind(this);
    
    this.error = function(text) {
      this.messages.push({ type: "error", text: text, expire: moment().add("second", 20) });
      startTimer();
      console.error("ERROR", text);
    }.bind(this);

    this.success = function(text) {
      this.messages.push({ type: "success", text: text, expire: moment().add("second", 15) });
      startTimer();
      console.log("SUCCESS", text);
    }.bind(this);
    
    this.info = function(text) {
      this.messages.push({ type: "info", text: text, expire: moment().add("second", 60) });
      startTimer();
      console.log("INFO", text);
    }.bind(this);
    
    this.close = function(message) {
      this.messages.remove(message);
    }.bind(this);
  };
  
  return new Notification();
});
