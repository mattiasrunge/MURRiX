
murrix.model = function()
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "invalid", args: [] }), secondary: ko.observable("") });

  self.currentUser = ko.observable(false);

  self.setCurrentUserData = function(userData)
  {
    if (self.currentUser() === false)
    {
      if (userData !== false)
      {
        murrix.cache.clear();
        self.currentUser(ko.mapping.fromJS(userData));
      }
    }
    else
    {
      if (userData === false)
      {
        murrix.cache.clear();
        self.currentUser(userData);
      }
      else
      {
        murrix.cache.clear();
        ko.mapping.fromJS(userData, self.currentUser);
      }
    }
  };

  self.dummySubmit = function() {};

  self.randomClicked = function()
  {
    murrix.server.emit("findRandom", "nodes", function(error, nodeData)
    {
      if (error)
      {
        console.log(error); // TODO: Display this to the user somehow
        return;
      }

      murrix.cache.addNodeData(nodeData);

      var newPath = "node:" + nodeData._id;

      if (murrix.model.path().secondary() !== "")
      {
        newPath += "/" + murrix.model.path().secondary();
      }

      document.location.hash = newPath;
    });
  };

  $(window).unload(function()
  {
    console.log("Leaving page, will clear cache!");
    murrix.cache.clear();
    nodeModel.node(false);
  });

  $("form.modal").on("show", function(form)
  {
    //murrix.resetForm(form.target);
  });

  $("form.modal").on("shown", function(form)
  {
    $(form.target).find("input, textarea, select").get(0).focus();
  });

  $("form.modal").on("hidden", function(form)
  {
    murrix.resetForm(form.target);
  });

  self.adminModel = new AdminModel(self);
  self.configModel = new ConfigModel(self);
  self.nodeModel = new NodeModel(self);
  self.searchModel = new SearchModel(self);
  self.welcomeModel = new WelcomeModel(self);
  self.newsModel = new NewsModel(self);
  self.browseModel = new BrowseModel(self);
  self.tagsModel = new TagsModel(self);
  self.todoModel = new TodoModel(self);
  self.mapModel = new MapModel(self);
  self.whenModel = new WhenModel(self);


  $("#selectDatetimeModal").on("shown", function()
  {
    $(".timepicker").timepicker({
      minuteStep  : 1,
      showSeconds : true,
      defaultTime : "value",
      showMeridian: false,
      showInputs  : false
    });

    $(".datepicker").datepicker({
      format    : "yyyy-mm-dd",
      weekStart : 1
    });
  });

  self.timezones = [
    { offset: -43200, name: "(GMT-12:00) International Date Line West" },
    { offset: -39600, name: "(GMT-11:00) Midway Island, Samoa" },
    { offset: -36000, name: "(GMT-10:00) Hawaii" },
    { offset: -32400, name: "(GMT-09:00) Alaska" },
    { offset: -28800, name: "(GMT-08:00) Pacific Time (US & Canada); Tijuana" },
    { offset: -25200, name: "(GMT-07:00) Arizona" },
    { offset: -25200, name: "(GMT-07:00) Chihuahua, La Paz, Mazatlan" },
    { offset: -25200, name: "(GMT-07:00) Mountain Time (US & Canada)" },
    { offset: -21600, name: "(GMT-06:00) Central America" },
    { offset: -21600, name: "(GMT-06:00) Central Time (US & Canada)" },
    { offset: -21600, name: "(GMT-06:00) Guadalajara, Mexico City, Monterrey" },
    { offset: -21600, name: "(GMT-06:00) Saskatchewan" },
    { offset: -18000, name: "(GMT-05:00) Bogota, Lima, Quito" },
    { offset: -18000, name: "(GMT-05:00) Eastern Time (US & Canada)" },
    { offset: -18000, name: "(GMT-05:00) Indiana (East)" },
    { offset: -14400, name: "(GMT-04:00) Atlantic Time (Canada)" },
    { offset: -14400, name: "(GMT-04:00) Caracas, La Paz" },
    { offset: -14400, name: "(GMT-04:00) Santiago" },
    { offset: -12600, name: "(GMT-03:30) Newfoundland" },
    { offset: -10800, name: "(GMT-03:00) Brasilia" },
    { offset: -10800, name: "(GMT-03:00) Buenos Aires, Georgetown" },
    { offset: -10800, name: "(GMT-03:00) Greenland" },
    { offset: -7200, name: "(GMT-02:00) Mid-Atlantic" },
    { offset: -3600, name: "(GMT-01:00) Azores" },
    { offset: -3600, name: "(GMT-01:00) Cape Verde Is." },
    { offset:  0, name: "(GMT) Casablanca, Monrovia" },
    { offset:  0, name: "(GMT) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London" },
    { offset:  3600, name: "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna" },
    { offset:  3600, name: "(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague" },
    { offset:  3600, name: "(GMT+01:00) Brussels, Copenhagen, Madrid, Paris" },
    { offset:  3600, name: "(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb" },
    { offset:  3600, name: "(GMT+01:00) West Central Africa" },
    { offset:  7200, name: "(GMT+02:00) Athens, Beirut, Istanbul, Minsk" },
    { offset:  7200, name: "(GMT+02:00) Bucharest" },
    { offset:  7200, name: "(GMT+02:00) Cairo" },
    { offset:  7200, name: "(GMT+02:00) Harare, Pretoria" },
    { offset:  7200, name: "(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius" },
    { offset:  7200, name: "(GMT+02:00) Jerusalem" },
    { offset:  10800, name: "(GMT+03:00) Baghdad" },
    { offset:  10800, name: "(GMT+03:00) Kuwait, Riyadh" },
    { offset:  10800, name: "(GMT+03:00) Moscow, St. Petersburg, Volgograd" },
    { offset:  10800, name: "(GMT+03:00) Nairobi" },
    { offset:  12600, name: "(GMT+03:30) Tehran" },
    { offset:  14400, name: "(GMT+04:00) Abu Dhabi, Muscat" },
    { offset:  14400, name: "(GMT+04:00) Baku, Tbilisi, Yerevan" },
    { offset:  16200, name: "(GMT+04:30) Kabul" },
    { offset:  18000, name: "(GMT+05:00) Ekaterinburg" },
    { offset:  18000, name: "(GMT+05:00) Islamabad, Karachi, Tashkent" },
    { offset:  19800, name: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi" },
    { offset:  20700, name: "(GMT+05:45) Kathmandu" },
    { offset:  21600, name: "(GMT+06:00) Almaty, Novosibirsk" },
    { offset:  21600, name: "(GMT+06:00) Astana, Dhaka" },
    { offset:  21600, name: "(GMT+06:00) Sri Jayawardenepura" },
    { offset:  23400, name: "(GMT+06:30) Rangoon" },
    { offset:  25200, name: "(GMT+07:00) Bangkok, Hanoi, Jakarta" },
    { offset:  25200, name: "(GMT+07:00) Krasnoyarsk" },
    { offset:  28800, name: "(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi" },
    { offset:  28800, name: "(GMT+08:00) Irkutsk, Ulaan Bataar" },
    { offset:  28800, name: "(GMT+08:00) Kuala Lumpur, Singapore" },
    { offset:  28800, name: "(GMT+08:00) Perth" },
    { offset:  28800, name: "(GMT+08:00) Taipei" },
    { offset:  32400, name: "(GMT+09:00) Osaka, Sapporo, Tokyo" },
    { offset:  32400, name: "(GMT+09:00) Seoul" },
    { offset:  32400, name: "(GMT+09:00) Vakutsk" },
    { offset:  34200, name: "(GMT+09:30) Adelaide" },
    { offset:  34200, name: "(GMT+09:30) Darwin" },
    { offset:  36000, name: "(GMT+10:00) Brisbane" },
    { offset:  36000, name: "(GMT+10:00) Canberra, Melbourne, Sydney" },
    { offset:  36000, name: "(GMT+10:00) Guam, Port Moresby" },
    { offset:  36000, name: "(GMT+10:00) Hobart" },
    { offset:  36000, name: "(GMT+10:00) Vladivostok" },
    { offset:  39600, name: "(GMT+11:00) Magadan, Solomon Is., New Caledonia" },
    { offset:  43200, name: "(GMT+12:00) Auckland, Wellington" },
    { offset:  43200, name: "(GMT+12:00) Fiji, Kamchatka, Marshall Is." },
    { offset:  46800, name: "(GMT+13:00) Nuku'alofa" }
  ];

  return this;
}();
