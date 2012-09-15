<?

require_once("murrix/libs/murrix.utils.php");


class MurrixModuleUser extends MurrixModule
{
  protected $default_username_  = "anonymous";
  protected $user_id_           = 0;
 
  
  function __construct($options)
  {
    /* Initialize variables */
    $this->default_username_ = $options["default_username"];
    
    
    /* Set default user */
    $this->ActionLogout($out_node);
    
    
    /* Register actions */
    $this->registerAction("Login",        array($this, "ActionLogin"),        array("Username", "Password"),            array("Node"));
    $this->registerAction("Logout",       array($this, "ActionLogout"),       array(),                                  array("Node"));
  }

  
  /* Public methods */

  public function getFrontendOptions()
  {
    return array("user_id" => $this->GetUserId(), "default_username" => $this->default_username_);
  }
  
  public function GetUserId()
  {
    return $this->user_id_;
  }

  public function GetUser()
  {
    $db = $_SESSION["Modules"]["db"]->GetDb();
    
    return $_SESSION["Modules"]["db"]->FetchNode($db, $this->user_id_);
  }


  /* Action functions */
  
  public function ActionLogin($in_username, $in_password, &$out_node)
  {
    $db = $_SESSION["Modules"]["db"]->GetDb();
    
    $searchQuery = array("type" => "user", "attributes" => array("Username" => $in_username, "Password" => sha1($in_password)));
    
    $node_id_list = $_SESSION["Modules"]["db"]->SearchNodeIds($db, $searchQuery);
    
    if (count($node_id_list) == 0)
    {
      throw new Exception("Could not find the requested user", MURRIX_RESULT_CODE_USER_NOT_FOUND);
    }
    
    $out_node = $_SESSION["Modules"]["db"]->FetchNode($db, reset($node_id_list));

    foreach ($out_node["attributes"] as $key => $attribute)
    {
      if ($attribute["name"] == "Password")
      {
        $out_node["attributes"][$key]["value"] = "";
      }
    }
    
    $this->user_id_ = $out_node["id"];
  }
  
  public function ActionLogout(&$out_node)
  {
    $db = $_SESSION["Modules"]["db"]->GetDb();
    
    $searchQuery = array("type" => "user", "attributes" => array("Username" => "anonymous"));
    
    $node_id_list = $_SESSION["Modules"]["db"]->SearchNodeIds($db, $searchQuery);
    
    if (count($node_id_list) == 0)
    {
      throw new Exception("Could not find the requested user", MURRIX_RESULT_CODE_USER_NOT_FOUND);
    }
    
    $out_node = $_SESSION["Modules"]["db"]->FetchNode($db, reset($node_id_list));

    foreach ($out_node["attributes"] as $key => $attribute)
    {
      if ($attribute["name"] == "Password")
      {
        $out_node["attributes"][$key]["value"] = "";
      }
    }
    
    $this->user_id_ = $out_node["id"];
  }
}

?>