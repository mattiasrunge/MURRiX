
define([
  "widget",
  "text!./index.html",
  "notification",
  "jquery",
  "knockout",
  "tools",
  "murrix"
], function(widget, template, notification, $, ko, tools, murrix) {
  widget({
    template: template,
    name: "timePicker",
    onCreate: function(settings) {
      this.model.disable = settings.disable;
      this.model.value = ko.observable("");
      this.model.focus = ko.observable(false);
      
      this.model.year = ko.observable("");
      this.model.month = ko.observable("");
      this.model.day = ko.observable("");
      this.model.hour = ko.observable("");
      this.model.minute = ko.observable("");
      this.model.second = ko.observable("");
      this.model.timezone = ko.observable("");
      
      this.model.yearDisable = ko.computed(function() {
        return this.model.disable();
      }.bind(this));
      this.model.monthDisable = ko.computed(function() {
        return this.model.disable() || this.model.year() === "";
      }.bind(this));
      this.model.dayDisable = ko.computed(function() {
        return this.model.disable() || this.model.month() === "";
      }.bind(this));
      this.model.hourDisable = ko.computed(function() {
        return this.model.disable() || this.model.day() === "";
      }.bind(this));
      this.model.minuteDisable = ko.computed(function() {
        return this.model.disable() || this.model.hour() === "";
      }.bind(this));
      this.model.secondDisable = ko.computed(function() {
        return this.model.disable() || this.model.minute() === "";
      }.bind(this));
      this.model.timezoneDisable = ko.computed(function() {
        return this.model.disable() || this.model.hour() === "";
      }.bind(this));
      
      this.model.yearList = ko.observableArray(tools.getList("years"));
      this.model.monthList = ko.observableArray(tools.getList("months"));
      this.model.dayList = ko.observableArray(tools.getList("days"));
      this.model.hourList = ko.observableArray(tools.getList("hours"));
      this.model.minuteList = ko.observableArray(tools.getList("minutes"));
      this.model.secondList = ko.observableArray(tools.getList("seconds"));
      this.model.timezoneList = ko.observableArray([
        "(GMT-12:00) International Date Line West",
        "(GMT-11:00) Midway Island, Samoa",
        "(GMT-10:00) Hawaii",
        "(GMT-09:00) Alaska",
        "(GMT-08:00) Pacific Time (US & Canada); Tijuana",
        "(GMT-07:00) Arizona",
        "(GMT-07:00) Chihuahua, La Paz, Mazatlan",
        "(GMT-07:00) Mountain Time (US & Canada)",
        "(GMT-06:00) Central America",
        "(GMT-06:00) Central Time (US & Canada)",
        "(GMT-06:00) Guadalajara, Mexico City, Monterrey",
        "(GMT-06:00) Saskatchewan",
        "(GMT-05:00) Bogota, Lima, Quito",
        "(GMT-05:00) Eastern Time (US & Canada)",
        "(GMT-05:00) Indiana (East)",
        "(GMT-04:00) Atlantic Time (Canada)",
        "(GMT-04:00) Caracas, La Paz",
        "(GMT-04:00) Santiago",
        "(GMT-03:30) Newfoundland",
        "(GMT-03:00) Brasilia",
        "(GMT-03:00) Buenos Aires, Georgetown",
        "(GMT-03:00) Greenland",
        "(GMT-02:00) Mid-Atlantic",
        "(GMT-01:00) Azores",
        "(GMT-01:00) Cape Verde Is.",
        "(GMT) Casablanca, Monrovia",
        "(GMT) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London",
        "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna",
        "(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague",
        "(GMT+01:00) Brussels, Copenhagen, Madrid, Paris",
        "(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb",
        "(GMT+01:00) West Central Africa",
        "(GMT+02:00) Athens, Beirut, Istanbul, Minsk",
        "(GMT+02:00) Bucharest",
        "(GMT+02:00) Cairo",
        "(GMT+02:00) Harare, Pretoria",
        "(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius",
        "(GMT+02:00) Jerusalem",
        "(GMT+03:00) Baghdad",
        "(GMT+03:00) Kuwait, Riyadh",
        "(GMT+03:00) Moscow, St. Petersburg, Volgograd",
        "(GMT+03:00) Nairobi",
        "(GMT+03:30) Tehran",
        "(GMT+04:00) Abu Dhabi, Muscat",
        "(GMT+04:00) Baku, Tbilisi, Yerevan",
        "(GMT+04:30) Kabul",
        "(GMT+05:00) Ekaterinburg",
        "(GMT+05:00) Islamabad, Karachi, Tashkent",
        "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi",
        "(GMT+05:45) Kathmandu",
        "(GMT+06:00) Almaty, Novosibirsk",
        "(GMT+06:00) Astana, Dhaka",
        "(GMT+06:00) Sri Jayawardenepura",
        "(GMT+06:30) Rangoon",
        "(GMT+07:00) Bangkok, Hanoi, Jakarta",
        "(GMT+07:00) Krasnoyarsk",
        "(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi",
        "(GMT+08:00) Irkutsk, Ulaan Bataar",
        "(GMT+08:00) Kuala Lumpur, Singapore",
        "(GMT+08:00) Perth",
        "(GMT+08:00) Taipei",
        "(GMT+09:00) Osaka, Sapporo, Tokyo",
        "(GMT+09:00) Seoul",
        "(GMT+09:00) Vakutsk",
        "(GMT+09:30) Adelaide",
        "(GMT+09:30) Darwin",
        "(GMT+10:00) Brisbane",
        "(GMT+10:00) Canberra, Melbourne, Sydney",
        "(GMT+10:00) Guam, Port Moresby",
        "(GMT+10:00) Hobart",
        "(GMT+10:00) Vladivostok",
        "(GMT+11:00) Magadan, Solomon Is., New Caledonia",
        "(GMT+12:00) Auckland, Wellington",
        "(GMT+12:00) Fiji, Kamchatka, Marshall Is.",
        "(GMT+13:00) Nuku'alofa"
      ]);
    },
    onDestroy: function() {
    }
  });
});
