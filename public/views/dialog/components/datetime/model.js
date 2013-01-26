
function DialogComponentDatetimeModel()
{
  var self = this;

  DialogComponentBaseModel(self, "dialogComponentDatetimeTemplate");

  /* Public observables, disables the component or part of it */
  self.disabledDateTime = ko.observable(false); // Disables date time inputs, only timezone and daylight savings enabled


  /* Private observables */
  self.year = ko.observable("XXXX");
  self.month = ko.observable("XX");
  self.day = ko.observable("XX");
  self.hour = ko.observable("XX");
  self.minute = ko.observable("XX");
  self.second = ko.observable("XX");
  self.timezone = ko.observable("Unknown");
  self.daylightSavings = ko.observable(false);

  self.yearDisabled = ko.computed(function()
  {
    return self.disabled() || self.disabledDateTime();
  });

  self.monthDisabled = ko.computed(function()
  {
    return self.disabled() || self.disabledDateTime() || self.year() === "XXXX";
  });

  self.dayDisabled = ko.computed(function()
  {
    return self.disabled() || self.disabledDateTime() || self.month() === "XX";
  });

  self.hourDisabled = ko.computed(function()
  {
    return self.disabled() || self.disabledDateTime() || self.day() === "XX";
  });

  self.minuteDisabled = ko.computed(function()
  {
    return self.disabled() || self.disabledDateTime() || self.hour() === "XX";
  });

  self.secondDisabled = ko.computed(function()
  {
    return self.disabled() || self.disabledDateTime() || self.minute() === "XX";
  });

  self.timezoneDisabled = ko.computed(function()
  {
    return self.disabled() || self.hour() === "XX";
  });

  self.daylightSavingsDisabled = ko.computed(function()
  {
    return self.disabled() || self.hour() === "XX";
  });


  /* Private observable, keeps track of the current value */
  self.internalValue = ko.observable({ datestring: false, timezone: false, daylightSavings: false });


  /* Private computed, keeping track of the datestring and reset observables if needed */
  self.datestring = ko.computed({
    read: function()
    {
      if (self.year() === "XXXX")
      {
        self.month("XX");
      }

      if (self.month() === "XX")
      {
        self.day("XX");
      }

      if (self.day() === "XX")
      {
        self.hour("XX");
      }

      if (self.hour() === "XX")
      {
        self.minute("XX");
        self.timezone("Unknown");
      }

      if (self.minute() === "XX")
      {
        self.second("XX");
      }

      var value = self.year() + "-" + self.month() + "-" + self.day() + " " + self.hour() + ":" + self.minute() + ":" + self.second();

      self.daylightSavings(murrix.isDaylightSavings(value));

      return value;
    },
    write: function(value)
    {
      var data = murrix.parseDatestring(value);

      self.year(data.year);
      self.month(data.month);
      self.day(data.day);
      self.hour(data.hour);
      self.minute(data.minute);
      self.second(data.second);
    }
  });

  /* Private observable to hinder multiple updates */
  self.updateValue = ko.observable(true);


  /* Public observable, value to be subscribed */
  self.value = ko.computed({
    read: function()
    {
      return self.internalValue();
    },
    write: function(value)
    {
      self.updateValue(false);

      value = value || {};

      self.datestring(value.datestring || "XXXX-XX-XX XX:XX:XX");
      self.timezone(value.timezone || "Unknown");
      self.daylightSavings(value.daylightSavings || false);

      self.updateValue(true);
    }
  });

  self.reset = function()
  {
    self.value(null);
  };


  /* Private computed, updates internal value only if it has changed */
  self.currentUpdater = ko.computed(function()
  {
    if ((self.datestring() !== self.internalValue().datestring || self.timezone() !== self.internalValue().timezone || self.daylightSavings() !== self.internalValue().daylightSavings) && self.updateValue())
    {
      self.internalValue({ datestring: self.datestring(), timezone: self.timezone(), daylightSavings: self.daylightSavings() });
    }
  });
};
