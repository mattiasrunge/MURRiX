<? require_once("murrix/murrix.base.php"); ?>
<!doctype html>
<!--[if lt IE 7]> <html class="no-js lt-ie9 lt-ie8 lt-ie7" lang="en"> <![endif]-->
<!--[if IE 7]>    <html class="no-js lt-ie9 lt-ie8" lang="en"> <![endif]-->
<!--[if IE 8]>    <html class="no-js lt-ie9" lang="en"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js" lang="en"> <!--<![endif]-->
<head>
  <meta charset="utf-8"/>

  <title></title>

  <meta name="description" content=""/>
  <meta name="author" content=""/>
  <meta name="viewport" content="width=device-width"/>

  <link type="text/css" rel="stylesheet" href="css/Aristo/Aristo.css"/>
  <link type="text/css" rel="stylesheet" href="css/style.css"/>

  <script type="text/javascript" src="js/libs/modernizr-2.5.3.min.js"></script>
  <script type="text/javascript" src="js/libs/sha1.min.js"></script>
  
  <?
  foreach ($murrix_css_files as $file)
  {
    ?>
      <link type="text/css" rel="stylesheet" href="<?=$file?>"/>
    <?
  }
  ?>
  
  <?
  foreach ($murrix_js_templates as $template_id => $file)
  {
    ?>
      <script id="<?=$template_id?>" type="text/x-jsrender">
        <? include($file); ?>
      </script>
    <?
  }
  ?>
</head>
<body>
  <header>
  </header>
  
  <div role="main">
  </div>
  
  <footer>
  </footer>

  <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
  <script>window.jQuery || document.write('<script type="text/javascript" src="js/libs/jquery-1.7.1.min.js"><\/script>')</script>

  <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js"></script>
  <script>window.jQuery || document.write('<script type="text/javascript" src="js/libs/jquery-ui-1.8.18.custom.min.js"><\/script>')</script>
  
  <script type="text/javascript" src="js/libs/jsrender.js"></script>
  <script type="text/javascript" src="js/libs/jquery.observable.js"></script>
  <script type="text/javascript" src="js/libs/jquery.views.js"></script>
  
  
  <script type="text/javascript" src="murrix/libs/murrix.result-codes.php?js"></script>
  <script type="text/javascript" src="murrix/murrix.base.js"></script>
  <script type="text/javascript" src="murrix/libs/murrix.wizard.js"></script>
  
  <script type="text/javascript">
    $.murrix.module_options = <?=json_encode($murrix_js_options);?>
  </script>
  
  <?
  foreach ($murrix_js_files as $file)
  {
    ?>
      <script type="text/javascript" src="<?=$file?>"></script>
    <?
  }
  ?>
</body>
</html>
