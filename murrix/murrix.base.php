<?

//set_include_path(get_include_path() . PATH_SEPARATOR . dirname($_SERVER["SCRIPT_FILENAME"]) . "/php/pear" . PATH_SEPARATOR . dirname($_SERVER["SCRIPT_FILENAME"]) . "/pear");

/* Turn on all errors */
error_reporting(E_ALL);


/* Start session */
session_name("murrix_test");
session_start();


/* Set up variables for module registration */
if (!isset($_SESSION["modules"]))
{
  $_SESSION["Modules"] = array();
}


/* Set up variables for use in index.php */
$murrix_js_files = array();
$murrix_js_templates = array();
$murrix_js_options = array();


/* Require some base files */
require_once("libs/murrix.result-codes.php");
require_once("libs/murrix.module.php");
require_once("murrix.config.php");


/* Function to call when to load a module */
function MurrixLoadModule($name, $options)
{
  /* Setup variables */
  global $murrix_js_files;
  global $murrix_js_templates;
  global $murrix_js_options;
  
  unset($files);
  
  $class_name = "MurrixModule" . ucfirst($name);
  $module_path = "murrix/modules/" . $name;
  
  
  /* Load module definition file */
  require_once($module_path . "/murrix." . $name . ".php");

  
  /* Load files in module */
  if (isset($files))
  {
    if (isset($files["php"]))
    {
      foreach ($files["php"] as $file)
      {
        require_once($module_path . "/" . $file);
      }
    }
    
    if (isset($files["js"]))
    {
      foreach ($files["js"] as $file)
      {
        $murrix_js_files[] = $module_path . "/" . $file;
      }
    }
    
    if (isset($files["tmpl"]))
    {
      foreach ($files["tmpl"] as $id => $file)
      {
        $murrix_js_templates[$id] = $module_path . "/" . $file;
      }
    }
  }
  
  
  /* Instansiate the module class if the is one */
  if (class_exists($class_name))
  {
    if (!isset($_SESSION["Modules"][$name]))
    {
      $_SESSION["Modules"][$name] = new $class_name($options);
    }

    $murrix_js_options[$name] = $_SESSION["Modules"][$name]->getFrontendOptions();
  }
  
  
  /* Cleanup */
  unset($files);
}


/* Handle API calls */
if (isset($_GET["Api"]))
{
  /* Set up the parameter object */
  $request = $_POST;

  
  /* Initialize reponse */
  $response = array();
  $response["TransactionId"]  = $request["TransactionId"];
  $response["ResultCode"]     = MURRIX_RESULT_CODE_OK;
  $response["Data"]           = array();
  
  
  try
  {
    /* Validate in parameters */
    if (!isset($request["Module"]) || !isset($request["Action"]))
    {
      throw new Exception("Missing parameters in API call", MURRIX_RESULT_CODE_PARAM);
    }

    if (!isset($_SESSION["Modules"][$request["Module"]]))
    {
      throw new Exception("Unknown module", MURRIX_RESULT_CODE_PARAM);
    }
    
    
    /* Make sure the data object is an array */
    if (!isset($request["Data"]))
    {
      $request["Data"] = array();
    }
       
    
    /* Call module action */
    $_SESSION["Modules"][$request["Module"]]->callAction($request["Action"], $request["Data"], &$response["Data"]);
  }
  catch (Exception $e)
  {
    $response["ResultCode"] = $e->getCode();
    $response["Message"]    = $e->getMessage();
  }


  /* Print the response */
  header("Content-Type: application/json");
  echo json_encode($response);

  
  /* Terminate execution */
  exit(0);
}
?>