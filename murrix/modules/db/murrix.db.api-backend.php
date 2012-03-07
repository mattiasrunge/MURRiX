<?

require_once("murrix/libs/murrix.utils.php");


class MurrixModuleDb extends MurrixModule
{
  protected $db_host_     = null;
  protected $db_name_     = null;
  protected $db_username_ = null;
  protected $db_password_ = null;
  
  
  function __construct($options)
  {
    /* Initialize variables */
    $this->db_host_     = $options["host"];
    $this->db_name_     = $options["name"];
    $this->db_username_ = $options["user"];
    $this->db_password_ = $options["password"];
    
        
    /* Register actions */
    $this->registerAction("CreateNode",   array($this, "ActionCreateNode"),   array("Node"),                            array("Node"));
    $this->registerAction("UpdateNode",   array($this, "ActionUpdateNode"),   array("Node"),                            array("Node"));
    $this->registerAction("DeleteNode",   array($this, "ActionDeleteNode"),   array("NodeId"),                          array("Node"));
    $this->registerAction("LinkNodes",    array($this, "ActionLinkNodes"),    array("NodeIdUp", "NodeIdDown", "Role"),  array("NodeUp", "NodeDown", "Role"));
    $this->registerAction("UnlinkNodes",  array($this, "ActionUnlinkNodes"),  array("NodeIdUp", "NodeIdDown", "Role"),  array("NodeUp", "NodeDown", "Role"));
    $this->registerAction("SearchNodeIds",array($this, "ActionSearchNodeIds"),array("Query"),                           array("NodeIdList"));
    $this->registerAction("FetchNodes",   array($this, "ActionFetchNodes"),   array("NodeIdList"),                      array("NodeList"));
  }

  
  /* Public methods */

  public function GetDb()
  {
    $db = new mysqli("p:" . $this->db_host_, $this->db_username_, $this->db_password_, $this->db_name_);
    
    
    /* Check for errors */
    if (mysqli_connect_errno())
    {
      throw new Exception("Open failed: " . mysqli_connect_error(), MURRIX_RESULT_CODE_DB);
    }
    
    
    /* Set up database settings */
    $db->set_charset("utf8");
    
    return $db;
  }
 
  public function Query($db, $query)
  {
    $result = null;
    
    if (($result = $db->query($query)) === FALSE)
    {
      throw new Exception($db->error . ": " . $query, MURRIX_RESULT_CODE_DB);
    }
    
    return $result;
  }
  
  public function FetchNode($db, $node_id)
  {
    $nodes = $this->FetchNodes($db, array($node_id));
    
    if (count($nodes) == 0)
    {
      throw new Exception("Could not find the requested node", MURRIX_RESULT_CODE_NODE_NOT_FOUND);
    }
    
    return reset($nodes);
  }
  
  public function FetchNodes($db, $node_id_list)
  {
    $nodes = array();
    
    
    /* Select from nodes */
    $query = "SELECT * FROM `Nodes` WHERE " . implode(" OR ", array_prefix_values($node_id_list, "`id` = "));
   
    $db_result = $this->Query($db, $query);
    
    while ($row = $db_result->fetch_assoc())
    {
      $nodes[$row["id"]] = $row;
      $nodes[$row["id"]]["attributes"] = array();
      $nodes[$row["id"]]["links_up"] = array();
      $nodes[$row["id"]]["links_down"] = array();
    }
    
    
    /* Select from attributs */
    $query = "SELECT * FROM `Attributes` WHERE " . implode(" OR ", array_prefix_values($node_id_list, "`node_id` = "));
    
    $db_result = $this->Query($db, $query);
     
    while ($row = $db_result->fetch_assoc())
    {
      $nodes[$row["node_id"]]["attributes"][$row["name"]] = $row["value"];
    }
   
    
    /* Select from roles as up */
    $query = "SELECT * FROM `Links` WHERE " . implode(" OR ", array_prefix_values($node_id_list, "`node_id_up` = "));
    
    $db_result = $this->Query($db, $query);
     
    while ($row = $db_result->fetch_assoc())
    {
      $nodes[$row["node_id_up"]]["links_up"][] = array("node_id" => $row["node_id_down"], "role" => $row["role"]); 
    }
   
   
    /* Select from roles as down */
    $query = "SELECT * FROM `Links` WHERE " . implode(" OR ", array_prefix_values($node_id_list, "`node_id_down` = "));
   
    $db_result = $this->Query($db, $query);
     
    while ($row = $db_result->fetch_assoc())
    {
      $nodes[$row["node_id_down"]]["links_down"][] = array("node_id" => $row["node_id_up"], "role" => $row["role"]); 
    }
   
   
    return $nodes;  
  }
  
  public function SearchNodeIds($db, $searchQuery, $name_compare = "=", $delimiter = "AND")
  {
    $node_id_list = array();
    
    $dbQuery_select = array("`Nodes`.`id` AS `node_id`");
    $dbQuery_from = array("`Nodes`");
    $dbQuery_where = array();
    
    if (isset($searchQuery["id"]))
    {
      $dbQuery_where[] = "(`Nodes`.`id` = " . mysql_escape_string($searchQuery["id"]) . ")";
    }
    
    if (isset($searchQuery["name"]))
    {
      $dbQuery_where[] = "(`Nodes`.`name` " . $name_compare . " '" . mysql_escape_string($searchQuery["name"]) . "')";
    }
    
    if (isset($searchQuery["type"]))
    {
      $dbQuery_where[] = "(`Nodes`.`type` = '" . mysql_escape_string($searchQuery["type"]) . "')";
    }
    
    if (isset($searchQuery["attributes"]))
    {
      $count = 1;
      
      foreach ($searchQuery["attributes"] as $name => $value)
      {
        $alias = "attr_" . $count;
        $count++;
        
        //$dbQuery_select[] = "`" . $alias . "`.`name` AS '" . $alias . "_name', `" . $alias . "`.`value` AS '" . $alias . "_value'";
        $dbQuery_from[] = "`Attributes` as `" . $alias . "`";
        $dbQuery_where[] = "(`Nodes`.`id` = `" . $alias . "`.`node_id` AND `" . $alias . "`.`name` " . $name_compare . " '" . $name . "' AND `" . $alias . "`.`value` = '" . $value . "')";
      }
    }
    
    $query = "SELECT " . implode(", ", $dbQuery_select) . " FROM " . implode(", ", $dbQuery_from) . " WHERE " . implode(" " . $delimiter . " ", $dbQuery_where);
    
    $db_result = $this->Query($db, $query);
    
    while ($row = $db_result->fetch_assoc())
    {
      /*$node = array();
      $node["attributes"] = array();
      
      foreach ($row as $key => $value)
      {
        list($attr, $index, $what) = explode("_", $key, 3);
        
        if ($attr == "attr" && $what == "name")
        {
          $node["attributes"][$value] = $row[$attr . "_" . $index . "_value"];
        }
        else if ($attr != "attr")
        {
          $node[$key] = $value;
        }
      }
      
      $nodes[$node["id"]] = $node;*/
      $node_id_list[] = $row["node_id"];
    }
    
    return $node_id_list;
  }
  
  
  /* Action functions */
   
  public function ActionCreateNode($in_node, &$out_node)
  {
    // TODO: Check if allowed to create type
    
    /* Get the database */    
    $db = $this->GetDb();
    
    
    /* Turn off autocommit */
    $db->autocommit(FALSE);
    
    
    try
    {
      /* Insert into Nodes */
      $query = "INSERT INTO `Nodes` (`type`, `name`, `created`) VALUES ('" . mysql_escape_string($in_node["type"]) . "', '" . mysql_escape_string($in_node["name"]) . "', CURRENT_TIMESTAMP)";
      
      $this->Query($db, $query);
      
      $in_node["id"] = $db->insert_id;
      
      
      /* Insert into Attributes */
      foreach ($in_node["attributes"] as $key => $value)
      {
        $query = "INSERT INTO `Attributes` (`node_id`, `name`, `value`) VALUES (" . mysql_escape_string($in_node["id"]) . ", '" . $key . "', '" . mysql_escape_string($value) . "')";
      
        $this->Query($db, $query);
      }
      
      /* Commit transaction */
      $db->commit();
    }
    catch (Exception $e)
    {
      /* Roll back transaction */
      $db->rollback();
     
     
      /* Turn on autocommit */
      $db->autocommit(TRUE);
        
      
      /* Rethrow error */
     throw $e;
    }
     
      
    /* Turn on autocommit */
    $db->autocommit(TRUE);
    
    
    /* Set out node */
    $out_node = $in_node;    
  }
  
  public function ActionUpdateNode($in_node, &$out_node)
  {
    // TODO: Check if allowed to update
    
    /* Get the database */    
    $db = $this->GetDb();
    
    
    /* Turn off autocommit */
    $db->autocommit(FALSE);
    
    
    try
    {
      /* Update Nodes */
      $query = "UPDATE `Nodes` SET `name` = '" . mysql_escape_string($in_node["name"]) . "' WHERE `id` = " . mysql_escape_string($in_node["id"]);
      
      $this->Query($db, $query);
      
      
      /* Delete from Attributes */
      $query = "DELETE FROM `Attributes` WHERE `node_id` = " . mysql_escape_string($in_node["id"]);
  
      $this->Query($db, $query);
      
      
      /* Insert into Attributes */
      foreach ($in_node["attributes"] as $key => $value)
      {
        $query = "INSERT INTO `Attributes` (`node_id`, `name`, `value`) VALUES (" . mysql_escape_string($in_node["id"]) . ", '" . mysql_escape_string($key) . "', '" . mysql_escape_string($value) . "')";
      
        $this->Query($db, $query);
      }
      
      /* Commit transaction */
      $db->commit();
    }
    catch (Exception $e)
    {
      /* Roll back transaction */
      $db->rollback();
     
     
      /* Turn on autocommit */
      $db->autocommit(TRUE);
        
      
      /* Rethrow error */
     throw $e;
    }
     
      
    /* Turn on autocommit */
    $db->autocommit(TRUE);
    
    
    /* Set out node */
    $out_node = $in_node;    
  }
  
  public function ActionDeleteNode($in_node_id, &$out_node)
  {
    // TODO: Check if allowed to delete
    
    $db = $this->GetDb();

    /* Get the node to delete */    
    $out_node = $this->FetchNode($db, $in_node_id);
    
    
    /* Delete the node */
    $query = "DELETE FROM `Nodes` WHERE `id` = " . mysql_escape_string($in_node_id);
    
    $this->Query($db, $query);
  }
  
  public function ActionLinkNodes($in_node_id_up, $in_node_id_down, $in_role, &$out_node_up, &$out_node_down, &$out_role)
  {
    // TODO: Check if allowed to link
    
    $db = $this->GetDb();
    
    
    /* Create new link */
    $query = "INSERT INTO `Links` (`node_id_up`, `node_id_down`, `role`) VALUES (" . mysql_escape_string($in_node_id_up) . ", " . mysql_escape_string($in_node_id_down) . ", '" . mysql_escape_string($in_role) . "')";
      
    $this->Query($db, $query);
    
    
    /* Fetch updated nodes */
    $nodes = $this->FetchNodes($db, array($in_node_id_up, $in_node_id_down));
    
    if (count($nodes) == 0)
    {
      throw new Exception("Could not find the requested node", MURRIX_RESULT_CODE_REQUEST_FAILED);
    }
    
    $out_node_up    = $nodes[$in_node_id_up];
    $out_node_down  = $nodes[$in_node_id_down];
    $out_role       = $in_role;
  }

  public function ActionUnlinkNodes($in_node_id_up, $in_node_id_down, $in_role, &$out_node_up, &$out_node_down, &$out_role)
  {
    // TODO: Check if allowed to unlink
    
    $db = $this->GetDb();
    
    
    /* Delete link */
    $query = "DELETE FROM `Links` WHERE `node_id_up` = " . mysql_escape_string($in_node_id_up) . " AND `node_id_down` = " . mysql_escape_string($in_node_id_down) . " AND `role` = '" . mysql_escape_string($in_role) . "'";
    
    $this->Query($db, $query);
    
    
    /* Fetch updated nodes */
    $nodes = $this->FetchNodes($db, array($in_node_id_up, $in_node_id_down));
    
    if (count($nodes) == 0)
    {
      throw new Exception("Could not find the requested node", MURRIX_RESULT_CODE_REQUEST_FAILED);
    }
    
    $out_node_up    = $nodes[$in_node_id_up];
    $out_node_down  = $nodes[$in_node_id_down];
    $out_role       = $in_role;
  }

  public function ActionSearchNodeIds($in_quary, &$out_node_id_list)
  {
    $db = $this->GetDb();
    
    $out_node_id_list = $this->SearchNodeIds($db, $in_quary, "LIKE", "OR");
  }
  
  public function ActionFetchNodes($in_node_id_list, &$out_node_list)
  {
    $db = $this->GetDb();
    
    $out_node_list = $this->FetchNodes($db, $in_node_id_list);
  }
}

?>