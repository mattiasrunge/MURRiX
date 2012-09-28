<?

require_once("murrix/libs/murrix.utils.php");


class MurrixModuleUser extends MurrixModule
{
  protected $default_username_          = "anonymous";
  protected $admin_username_            = "admin";
  protected $user_node_                 = false;
  protected $group_node_id_list_        = array();
 
  
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
    return $this->user_node_ !== false ? $this->user_node_["id"] : 0;
  }

  public function GetUser()
  {
    return $this->user_node_;
  }

  public function SetUser($out_node)
  {
    $this->user_node_ = $out_node;

    $this->group_node_id_list_ = array();

    foreach ($this->user_node_["links"] as $link)
    {
      if (($link["role"] == "user_member" || $link["role"] == "user_admin") && $link["direction"] == "up")
      {
        $this->group_node_id_list_[] = $link["node_id"]; 
      }
    }
  }

  public function IsAdmin()
  {
    if ($this->user_node_ != false)
    {
      foreach ($this->user_node_["attributes"] as $attribute)
      {
        if ($attribute["name"] == "Username" && $attribute["value"] == $this->admin_username_)
        {
          return true;
        }
      }
    }

    return false;
  }

  public function GetNodeIdAccess($node_id)
  {
    /* If admin, admin access always allowed */
    if ($this->IsAdmin())
    {
      return "admin";
    }


    /* If the current user id is the same as the node, admin access is always granted to the own node */
    if ($node_id == $this->GetUserId())
    {
      return "admin";
    }
    

    /* Not member of any groups, no access */
    if (count($this->group_node_id_list_) == 0)
    {
      return "";
    }


    /* Make sure node access cache list is initialized */
    if (!isset($GLOBALS['node_id_access']))
    {
      $GLOBALS['node_id_access'] = array();
    }


    /* If node access is cached, if not fetch from database and cache */
    if (!isset($GLOBALS['node_id_access'][$node_id]))
    {
      $db = $_SESSION["Modules"]["db"]->GetDb();

      $GLOBALS['node_id_access'][$node_id] = "";
    
      $query = "SELECT `level` FROM `Accesses` WHERE `node_id` = '" . $node_id . "' AND (" . implode(" OR ", array_prefix_values($this->group_node_id_list_, "`group_node_id` = ")) . ")";

      $db_result = $_SESSION["Modules"]["db"]->Query($db, $query);

      while ($row = $db_result->fetch_assoc())
      {
        $GLOBALS['node_id_access'][$node_id] = $_SESSION["Modules"]["db"]->MaxAccess($GLOBALS['node_id_access'][$node_id], $row["level"]);
      }
    }

    return $GLOBALS['node_id_access'][$node_id];
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
    
    $this->SetUser($out_node);
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
    
    $this->SetUser($out_node);
  }
}

?>