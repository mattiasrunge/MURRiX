<? require_once("murrix/murrix.base.php"); ?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>www.runge.se</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

    <link href="css/bootstrap.css" rel="stylesheet">
    <link href="css/bootstrap-responsive.css" rel="stylesheet">
    <link href="css/bootstrap-notify.css" rel="stylesheet">
    <link href="css/datepicker.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">

    <link href="views/search/style.css" rel="stylesheet">
    <link href="views/user/style.css" rel="stylesheet">
    <link href="views/node/style.css" rel="stylesheet">
    
    <!--[if lt IE 9]>
      <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <link rel="shortcut icon" href="ico/favicon.ico">
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="ico/apple-touch-icon-144-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="ico/apple-touch-icon-114-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="ico/apple-touch-icon-72-precomposed.png">
    <link rel="apple-touch-icon-precomposed" href="ico/apple-touch-icon-57-precomposed.png">
  </head>

  <body>
    <div class="loading-overlay"></div>
    <div class="notifications bottom-right notification"></div>

    <div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container-fluid">

          <a class="brand" href="#">www.runge.se</a>

            <div class="pull-right">
              <div class="pull-right" <?/*data-bind="if: profile.isAnonymous"*/?>>
                <a class="btn" href="#" <?/*data-bind="click: profile.profileClicked"*/?>
                  <i class="icon-user"></i> Sign In
                </a>
              </div>

              <div class="pull-right" <?/*data-bind="ifnot: profile.isAnonymous"*/?>>
                <div class="btn-group">
                  <a class="btn dropdown-toggle" data-toggle="dropdown" href="#" data-bind="click: false">
                    <i class="icon-user"></i> <span <?/*data-bind="text: profile.name"*/?>></span>
                    <span class="caret"></span>
                  </a>
                  <ul class="dropdown-menu">
                    <li><a href="#" <?/*data-bind="click: profile.profileClicked"*/?>>Profile</a></li>
                    <li><a href="#">Administration</a></li>
                    <li class="divider"></li>
                    <li><a href="#" <?/*data-bind="click: profile.signOutClicked"*/?>>Sign Out</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="divider-vertical pull-right"></div>

            <div class="btn-group pull-right">
              <a class="btn dropdown-toggle" data-toggle="dropdown" href="#">
                Create new
                <span class="caret"></span>
              </a>
              <ul class="dropdown-menu">
                <li><a href="#">Create album</a></li>
                <li><a href="#">Create person</a></li>
                <li><a href="#">Create location</a></li>
              </ul>
            </div>

          <div class="divider-vertical pull-right"></div>

          <form class="navbar-search pull-right" data-bind="submit: searchModel.searchSubmit">
            <input type="text" class="search-query" placeholder="Search" data-bind="value: searchModel.queryInput"/>
          </form>

        </div>
      </div>
    </div>


    <div class="background-map"></div>


    <!-- MURRiX view HTML files -->
    <? require("views/node/view.html"); ?>
    <? require("views/node/summary/view.html"); ?>
    <? require("views/node/timeline/view.html"); ?>
    <? require("views/node/pictures/view.html"); ?>
    <? require("views/node/relations/view.html"); ?>
    <? require("views/node/logbook/view.html"); ?>
    <? require("views/node/comments/view.html"); ?>
    <? require("views/node/connections/view.html"); ?>
    <? require("views/node/rights/view.html"); ?>
    <? require("views/search/view.html"); ?>




    <!-- Third-party script files -->
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.1/jquery.min.js"></script>
    <script>window.jQuery || document.write('<script src="js/jquery-1.8.1.min.js"><\/script>')</script>

    <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/jquery-ui.min.js"></script>
    <script>window.jQuery || document.write('<script type="text/javascript" src="js/jquery-ui-1.8.23.custom.min.js"><\/script>')</script>

    <script src="js/jquery.history.min.js"></script>
    <script src="https://maps.googleapis.com/maps/api/js?sensor=false"></script>
    <script src="js/knockout-2.1.0.js"></script>
    <script src="js/knockout.mapping-latest.js"></script>
    <script src="js/bootstrap.min.js"></script>
    <script src="js/bootstrap-notify.js"></script>
    <script src="js/bootstrap-datepicker.js"></script>
    <script src="js/moment.min.js"></script>




    <!-- MURRiX base library script files -->
    <script src="murrix/libs/murrix.result-codes.php?js"></script>
    <script src="murrix/murrix.base.js"></script>
    <script src="murrix/libs/murrix.file.js"></script>
    <script src="murrix/modules/map/murrix.map.js"></script>
    <script src="murrix/modules/db/murrix.db.api-frontend.js"></script>




    <!-- MURRiX view script files -->
    <script src="views/node/summary/model.js"></script>
    <script src="views/node/timeline/model.js"></script>
    <script src="views/node/pictures/model.js"></script>
    <script src="views/node/relations/model.js"></script>
    <script src="views/node/logbook/model.js"></script>
    <script src="views/node/comments/model.js"></script>
    <script src="views/node/connections/model.js"></script>
    <script src="views/node/rights/model.js"></script>
    <script src="views/node/model.js"></script>
    <script src="views/search/model.js"></script>
    <script src="views/user/model.js"></script>



    <!-- Initialization scripts and definitions -->
    <script>

      /* Knockout visibility changer (fading) handler  */
      ko.bindingHandlers.fadeVisible = {
        init: function(element, valueAccessor)
        {
          var value = valueAccessor();
          $(element).toggle(ko.utils.unwrapObservable(value));
        },
        update: function(element, valueAccessor)
        {
          var value = valueAccessor();
          ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).fadeOut();
        }
      };



      /* Knockout HTML data formater */
      ko.bindingHandlers.htmlDate = {
        init: function(element, valueAccessor)
        {
          var value = valueAccessor();
          var dateItem = moment(ko.utils.unwrapObservable(value) + "+0000", "YYYY-MM-DD HH:mm:ss Z");

          if (!dateItem.date())
          {
            $(element).html(ko.utils.unwrapObservable(value));
          }
          else
          {
            $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
          }
        },
        update: function(element, valueAccessor)
        {
          var value = valueAccessor();
          var dateItem = moment(ko.utils.unwrapObservable(value) + "+0000", "YYYY-MM-DD HH:mm:ss Z");

          if (!dateItem.date())
          {
            $(element).html(ko.utils.unwrapObservable(value));
          }
          else
          {
            $(element).html(dateItem.format("dddd, MMMM Do YYYY, HH:mm:ss Z"));
          }
        }
      };



      /* Startup configuration options */
      var startupConfig = <?=json_encode($murrix_js_options);?>



      /* Declaration of main model */
      var mainModel = null;

      $(function()
      {
        /* Definitiation of main model */
        mainModel = new function()
        {
          var self = this;

          self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });

          self.setPath = function(value)
          {
            $.murrix.updatePath(value, self.path);
          };

          self.userModel = new UserModel(self, startupConfig.user.user_id);
          self.nodeModel = new NodeModel(self);
          self.searchModel = new SearchModel(self);
        };



        /* Apply bindings on available views */
        ko.applyBindings(mainModel);



        /* Bind function to change content based on path */
        jQuery.History.bind(function(state)
        {
          mainModel.setPath(state);
        });


        /* Trigger loading if no path is set */
        if (document.location.hash.length == 0)
        {
          jQuery.History.trigger("");
        }


        /* Initialize background map */
        var options = {
          zoom: 13,
          center: new google.maps.LatLng(57.6706907666667, 11.9375348333333),
          mapTypeId: google.maps.MapTypeId.HYBRID,

          streetViewControl: false,
          panControl: false,
          mapTypeControl: false,
          zoomControl: true,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle.DEFAULT,
            position: google.maps.ControlPosition.RIGHT_TOP
          },
          scaleControl: true,
          scaleControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          }
        };

        $.murrix.module.map.show(".background-map", options);


        /* Clear loading overlay */
        $(".loading-overlay").fadeOut();
      });

    </script>
  </body>
</html>
 
