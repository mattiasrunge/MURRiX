
murrix.model = function()
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "invalid", args: [] }), secondary: ko.observable("") });

  self.title = ko.observable("MURRiX");

  self.title.subscribe(function(value)
  {
    $("title").text(value);
  });

  self.path().primary.subscribe(function()
  {
    self.title("MURRiX");
  });

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

  self.noClick = function(data, event)
  {
    event.preventDefault();
    event.stopPropagation();
    return false;
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

  $(".modal").on("shown", function(element)
  {
    if ($(element.target).find("input, textarea, select").length > 0)
    {
      $(element.target).find("input, textarea, select").get(0).focus();
    }
  });

  $("form.modal").on("hidden", function(form)
  {
    //murrix.resetForm(form.target);
  });

  self.adminModel = new AdminModel(self);
  self.configModel = new ConfigModel(self);
  self.nodeModel = new NodeModel(self);
  self.searchModel = new SearchModel(self);
  self.newsModel = new NewsModel(self);
  self.browseModel = new BrowseModel(self);
  self.tagsModel = new TagsModel(self);
  self.organizeModel = new OrganizeModel(self);
  self.helpModel = new HelpModel(self);
  self.todoModel = new TodoModel(self);
  self.mapModel = new MapModel(self);

  self.dialogModel = new DialogModel();

  self.timezones = [
    "Unknown",
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
  ];

  self.yearList = ko.computed(function()
  {
    var list = [];

    list.push({ value: "XXXX", name: "????" });

    for (var year = (new Date()).getFullYear(); year >= 1600; year--)
    {
      list.push({ value: year + "", name: year + "" });
    }

    return list;
  });

  self.monthList = ko.computed(function()
  {
    var list = [];

    list.push({ value: "XX", name: "??" });

    for (var month = 1; month < 13; month++)
    {
      list.push({ value: murrix.pad(month, 2), name: murrix.pad(month, 2) });
    }

    return list;
  });

  self.dayList = ko.computed(function()
  {
    var list = [];

    list.push({ value: "XX", name: "??" });

    for (var day = 1; day < 32; day++)
    {
      list.push({ value: murrix.pad(day, 2), name: murrix.pad(day, 2) });
    }

    return list;
  });

  self.hourList = ko.computed(function()
  {
    var list = [];

    list.push({ value: "XX", name: "??" });

    for (var hour = 0; hour < 60; hour++)
    {
      list.push({ value: murrix.pad(hour, 2), name: murrix.pad(hour, 2) });
    }

    return list;
  });

  self.minuteList = ko.computed(function()
  {
    var list = [];

    list.push({ value: "XX", name: "??" });

    for (var minute = 0; minute < 60; minute++)
    {
      list.push({ value: murrix.pad(minute, 2), name: murrix.pad(minute, 2) });
    }

    return list;
  });

  self.secondList = ko.computed(function()
  {
    var list = [];

    list.push({ value: "XX", name: "??" });

    for (var second = 0; second < 60; second++)
    {
      list.push({ value: murrix.pad(second, 2), name: murrix.pad(second, 2) });
    }

    return list;
  });

  return this;
}();
