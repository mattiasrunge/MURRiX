<?

require_once("murrix/libs/murrix.utils.php");


class MurrixModuleDb extends MurrixModule
{
  protected $db_host_     = null;
  protected $db_name_     = null;
  protected $db_username_ = null;
  protected $db_password_ = null;
  
  protected $uploaded_files = array();
  
  function __construct($options)
  {
    /* Initialize variables */
    $this->db_host_     = $options["host"];
    $this->db_name_     = $options["name"];
    $this->db_username_ = $options["user"];
    $this->db_password_ = $options["password"];
    
        
    /* Register actions */
    $this->registerAction("CreateNode",         array($this, "ActionCreateNode"),         array("Node"),                                            array("Node"));
    $this->registerAction("UpdateNode",         array($this, "ActionUpdateNode"),         array("Node"),                                            array("Node"));
    $this->registerAction("DeleteNode",         array($this, "ActionDeleteNode"),         array("NodeId"),                                          array("Node"));
    $this->registerAction("LinkNodes",          array($this, "ActionLinkNodes"),          array("NodeIdUp", "NodeIdDown", "Role"),                  array("NodeUp", "NodeDown", "Role"));
    $this->registerAction("UnlinkNodes",        array($this, "ActionUnlinkNodes"),        array("NodeIdUp", "NodeIdDown", "Role"),                  array("NodeUp", "NodeDown", "Role"));
    $this->registerAction("SearchNodeIds",      array($this, "ActionSearchNodeIds"),      array("Query"),                                           array("NodeIdList"));
    $this->registerAction("FetchNodes",         array($this, "ActionFetchNodes"),         array("NodeIdList"),                                      array("NodeList"));
    $this->registerAction("FetchPositions",     array($this, "ActionFetchPositions"),     array("Query"),                                           array("PositionList"));
    $this->registerAction("AddPositions",       array($this, "ActionAddPositions"),       array("NodeId", "PositionList"),                          array());
    $this->registerAction("UploadFile",         array($this, "ActionUploadFile"),         array("Id", "LastChunk", "Sha1"),                         array("Metadata"));
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
      $nodes[$row["id"]]["links"] = array();
    }
    
    
    /* Select from attributs */
    $query = "SELECT * FROM `Attributes` WHERE " . implode(" OR ", array_prefix_values($node_id_list, "`node_id` = "));
    
    $db_result = $this->Query($db, $query);
     
    while ($row = $db_result->fetch_assoc())
    {
      $nodes[$row["node_id"]]["attributes"][] = array("name" => $row["name"], "value" => $row["value"]);
    }
   
    
    /* Select from roles as up */
    $query = "SELECT * FROM `Links` WHERE " . implode(" OR ", array_prefix_values($node_id_list, "`node_id_up` = "));
    
    $db_result = $this->Query($db, $query);
     
    while ($row = $db_result->fetch_assoc())
    {
      $nodes[$row["node_id_up"]]["links"][] = array("node_id" => $row["node_id_down"], "role" => $row["role"], "direction" => "down");
    }
   
   
    /* Select from roles as down */
    $query = "SELECT * FROM `Links` WHERE " . implode(" OR ", array_prefix_values($node_id_list, "`node_id_down` = "));
   
    $db_result = $this->Query($db, $query);
     
    while ($row = $db_result->fetch_assoc())
    {
      $nodes[$row["node_id_down"]]["links"][] = array("node_id" => $row["node_id_up"], "role" => $row["role"], "direction" => "up");
    }
   
   
    return $nodes;
  }
  
  public function FetchPositions($db, $query)
  {
    $positions = array();
    
    $dbQuery_where = array();
    
    if (isset($query["node_id_list"]))
    {
      $dbQuery_where[] = "(" . implode(" OR ", array_prefix_values($query["node_id_list"], "`node_id` = ")) . ")";
    }

    if (isset($query["start_datetime"]) && isset($query["end_datetime"]))
    {
        $dbQuery_where[] = "(`datetime` BETWEEN '" . mysql_escape_string($query["start_datetime"]) . "' AND '" . mysql_escape_string($query["end_datetime"]) . "')";
    }
    else if (isset($query["start_datetime"]))
    {
      $dbQuery_where[] = "(`datetime` > '" . mysql_escape_string($query["start_datetime"]) . "')";
    }
    else if (isset($query["end_datetime"]))
    {
      $dbQuery_where[] = "(`datetime` < '" . mysql_escape_string($query["end_datetime"]) . "')";
    }

    if (isset($query["start_created"]))
    {
      $dbQuery_where[] = "(`created` > '" . mysql_escape_string($query["start_created"]) . "')";
    }

    if (isset($query["end_created"]))
    {
      $dbQuery_where[] = "(`created` < '" . mysql_escape_string($query["end_created"]) . "')";
    }
    
    if (isset($query["type"]))
    {
      $dbQuery_where[] = "(`Nodes`.`type` = '" . mysql_escape_string($query["type"]) . "')";
    }

    
    
    $query = "SELECT `id`, `node_id`, `source`, AsText(latitude_longitude), `type`, `created`, `datetime`, `hdop`, `vdop`, `pdop`, `satellites`, `altitude`, `height_of_geoid`, `speed`, `angle` FROM `Positions` WHERE " . implode(" AND ", $dbQuery_where) . " ORDER BY `datetime` DESC";

    $db_result = $this->Query($db, $query);
    
    while ($row = $db_result->fetch_assoc())
    {
      //POINT(57.6706907666667 11.9375348333333)
//      $coordinates = substr($row["AsText(latitude_longitude)"], 6, -1);
      
      list($row["latitude"], $row["longitude"]) = explode(" ", substr($row["AsText(latitude_longitude)"], 6, -1));
      unset($row["AsText(latitude_longitude)"]);

      if (!is_array($positions[$row["node_id"]]))
      {
        $positions[$row["node_id"]] = array();
      }
    
      $positions[$row["node_id"]][] = $row;
    }
    
  
    return $positions;  
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

    // TODO string query type which searches name and attribute values
    
    if (isset($searchQuery["string"]))
    {
      $dbQuery_where[] = "(`Nodes`.`name` COLLATE utf8_general_ci LIKE '%" . mysql_escape_string($searchQuery["string"]) . "%')";
    }

    if (isset($searchQuery["name"]))
    {
      $dbQuery_where[] = "(`Nodes`.`name` " . mysql_escape_string($name_compare) . " '" . mysql_escape_string($searchQuery["name"]) . "')";
    }
    
    if (isset($searchQuery["types"]))
    {
      foreach ($searchQuery["types"] as $type)
      {
        $dbQuery_where[] = "(`Nodes`.`type` = '" . mysql_escape_string($type) . "')";
      }
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
    if (($in_node["type"] == "user" || $in_node["type"] == "group") && !$_SESSION["Modules"]["user"]->IsAdmin())
    {
      throw new Exception("Could not create node.", MURRIX_RESULT_CODE_NO_RIGHTS);
    }
    
    
    /* Check if this is a file and if it exists in the upload list */
    if ($in_node["type"] == "file" && (!isset($this->uploaded_files[$in_node["uploadid"]]) || !file_exists($this->uploaded_files[$in_node["uploadid"]])))
    {
      throw new Exception("Could not find the upload file.", MURRIX_RESULT_CODE_FILE_NOT_FOUND);
    }
    
    
    /* Get the database */    
    $db = $this->GetDb();
    
    
    /* Turn off autocommit */
    $db->autocommit(FALSE);
    
    
    try
    {
      /* Insert into Nodes */
      $query = "INSERT INTO `Nodes` (`type`, `name`, `created`, `modified`, `description`) VALUES ('" . mysql_escape_string($in_node["type"]) . "', '" . mysql_escape_string($in_node["name"]) . "', CURRENT_TIMESTAMP, NOW(), '" . mysql_escape_string($in_node["description"]) . "')";
      
      $this->Query($db, $query);
      
      $in_node["id"] = $db->insert_id;
      
      
      /* If node is a file, move file object */
      if ($in_node["type"] == "file")
      {
        if (!rename($this->uploaded_files[$in_node["uploadid"]], "files2/" . $in_node["id"]))
        {
          throw new Exception("Could not move the uploaded file.", MURRIX_RESULT_CODE_FAILED_TO_MOVE_FILE);
        }
        
        unset($this->uploaded_files[$in_node["uploadid"]]);
        unset($in_node["uploadid"]);
        unset($in_node["filename"]);

        if (isset($in_node["attributes"]["MetaGPSDateTime"]))
        {
          $altitude = isset($in_node["attributes"]["MetaGPSAltitude"]) ? $in_node["attributes"]["MetaGPSAltitude"] : "0";
          $type     = isset($in_node["attributes"]["MetaGPSAltitude"]) ? "3D" : "2D";
  
        
          $query = "INSERT INTO `Positions` (`node_id`, `source`, `type`, `latitude_longitude`, `datetime`, `altitude`) VALUES(";
          $query     .=  $in_node["id"] . ",";
          $query     .=  "'exif',";
          $query     .=  "'" . $type . "',";
          $query     .=  "GeomFromText('POINT(" . $in_node["attributes"]["MetaGPSLatitude"] . " " . $in_node["attributes"]["MetaGPSLongitude"] . ")'),";
          $query     .=  "'" . $in_node["attributes"]["MetaGPSDateTime"] . "',";
          $query     .=  $altitude . "";
          $query     .=  ")";

          $this->Query($db, $query);
        }
        else if (isset($in_node["attributes"]["MetaDateTimeOriginal"]))
        {
          $query = "INSERT INTO `Positions` (`node_id`, `source`, `type`, `datetime`) VALUES(";
          $query     .=  $in_node["id"] . ",";
          $query     .=  "'exif',";
          $query     .=  "'None',";
          $query     .=  "'" . $in_node["attributes"]["MetaDateTimeOriginal"] . "',";
          $query     .=  ")";

          $this->Query($db, $query);
        }
        else if (isset($in_node["attributes"]["MetaCreatedTime"]))
        {
          $query = "INSERT INTO `Positions` (`node_id`, `source`, `type`, `datetime`) VALUES(";
          $query     .=  $in_node["id"] . ",";
          $query     .=  "'exif',";
          $query     .=  "'None',";
          $query     .=  "'" . $in_node["attributes"]["MetaCreatedTime"] . "',";
          $query     .=  ")";

          $this->Query($db, $query);
        }

        if (isset($in_node["attributes"]["MetaOrientation"]))
        {
          switch (intval($in_node["attributes"]["MetaOrientation"]))
          {
            case 1: //Normal
            {
              $in_node["attributes"]["Angle"] = 0;
              break;
            }
            case 8: // 270 CW (90 CCW)
            {
              $in_node["attributes"]["Angle"] = 90;
              break;
            }
            case 6: // 90 CW (270 CCW)
            {
              $in_node["attributes"]["Angle"] = 270;
              break;
            }
            case 3: // 180 CW (180 CCW)
            {
              $in_node["attributes"]["Angle"] = 180;
              break;
            }
          }
        }/* 1) transform="";;
 2) transform="-flip horizontal";;
 
 4) transform="-flip vertical";;
 5) transform="-transpose";;
 
 7) transform="-transverse";;*/
 

        if (isset($in_node["attributes"]["ImageDescription"]))
        {
          $in_node["description"] = $in_node["attributes"]["ImageDescription"];

          $query = "UPDATE `Nodes` SET `modified` = NOW(), `description` = '" . mysql_escape_string($in_node["description"]) . "' WHERE `id` = " . mysql_escape_string($in_node["id"]);

          $this->Query($db, $query);
        }
      }
      else if ($in_node["type"] == "user")
      {
        $in_node["attributes"]["Password"] = sha1($in_node["attributes"]["Password"]);
      }
      
      
      /* Insert into Attributes */
      if (is_array($in_node["attributes"]))
      {
        foreach ($in_node["attributes"] as $key => $value)
        {
          if ($value != "")
          {
            $query = "INSERT INTO `Attributes` (`node_id`, `name`, `value`) VALUES (" . mysql_escape_string($in_node["id"]) . ", '" . $key . "', '" . mysql_escape_string($value) . "')";

            $this->Query($db, $query);
          }
        }
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
    $out_node_list = array();
    $this->ActionFetchNodes(array($in_node["id"]), $out_node_list);

    $out_node = reset($out_node_list);
  }

  public function ActionAddPositions($in_node_id, $in_position_list)
  {
 // TODO: Check if allowed to create type

    /* Get the database */
    $db = $this->GetDb();


    /* Turn off autocommit */
    $db->autocommit(FALSE);


    try
    {
      foreach ($in_position_list as $position)
      {
        /* Insert into Positions */
        $query = "INSERT INTO `Positions` (`node_id`, `source`, `type`, `latitude_longitude`, `datetime`, `pdop`, `hdop`, `vdop`, `satellites`, `altitude`, `height_of_geoid`, `speed`, `angle`) VALUES(";
        $query     .=  $in_node_id . ",";
        $query     .=  "'" . $position['source'] . "',";
        $query     .=  "'" . $position['type'] . "',";
        $query     .=  "GeomFromText('POINT(" . (isset($position['latitude']) ? $position['latitude'] : 0) . " " . (isset($position['longitude']) ? $position['longitude'] : 0) . ")'),";
        $query     .=  "'" . (isset($position['datetime']) ? $position['datetime'] : "0000-00-00 00:00:00") . "',";
        $query     .=  (isset($position['pdop']) ? $position['pdop'] : 0) . ",";
        $query     .=  (isset($position['hdop']) ? $position['hdop'] : 0) . ",";
        $query     .=  (isset($position['vdop']) ? $position['vdop'] : 0) . ",";
        $query     .=  (isset($position['satellites']) ? $position['satellites'] : 0) . ",";
        $query     .=  (isset($position['altitude']) ? $position['altitude'] : 0) . ",";
        $query     .=  (isset($position['height_of_geoid']) ? $position['height_of_geoid'] : 0) . ",";
        $query     .=  (isset($position['speed']) ? $position['speed'] : 0) . ",";
        $query     .=  (isset($position['angle']) ? $position['angle'] : 0);
        $query     .=  ")";

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
      $query = "UPDATE `Nodes` SET `name` = '" . mysql_escape_string($in_node["name"]) . "', `type` = '" . mysql_escape_string($in_node["type"]) . "', `modified` = NOW(), `description` = '" . mysql_escape_string($in_node["description"]) . "' WHERE `id` = " . mysql_escape_string($in_node["id"]);
      
      $this->Query($db, $query);
      
      
      /* Delete from Attributes */
      $query = "DELETE FROM `Attributes` WHERE `node_id` = " . mysql_escape_string($in_node["id"]);
  
      $this->Query($db, $query);
      
      
      /* Insert into Attributes */
      if (is_array($in_node["attributes"]))
      {
        foreach ($in_node["attributes"] as $key => $value)
        {
          if ($value != "")
          {
            $query = "INSERT INTO `Attributes` (`node_id`, `name`, `value`) VALUES (" . mysql_escape_string($in_node["id"]) . ", '" . mysql_escape_string($key) . "', '" . mysql_escape_string($value) . "')";

            $this->Query($db, $query);
          }
        }
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
    $out_node = $this->FetchNode($db, $in_node["id"]);
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

  public function ActionSearchNodeIds($in_query, &$out_node_id_list)
  {
    $db = $this->GetDb();

    $out_node_id_list = array();
    $node_links_list = array();
    $node_id_list = $this->SearchNodeIds($db, $in_query, "LIKE", "OR");


    foreach ($node_id_list as $node_id)
    {
      $node_links_list[$node_id] = array();
    }

    
    /* Select from roles as up */
    $query = "SELECT * FROM `Links` WHERE " . implode(" OR ", array_prefix_values($node_id_list, "`node_id_up` = "));

    $db_result = $this->Query($db, $query);

    while ($row = $db_result->fetch_assoc())
    {
      $node_links_list[$row["node_id_up"]][] = array("node_id" => $row["node_id_down"], "role" => $row["role"], "direction" => "down");
    }


    /* Select from roles as down */
    $query = "SELECT * FROM `Links` WHERE " . implode(" OR ", array_prefix_values($node_id_list, "`node_id_down` = "));

    $db_result = $this->Query($db, $query);

    while ($row = $db_result->fetch_assoc())
    {
      $node_links_list[$row["node_id_down"]][] = array("node_id" => $row["node_id_up"], "role" => $row["role"], "direction" => "up");
    }


    foreach ($node_links_list as $node_id => $links)
    {
      if ($_SESSION["Modules"]["user"]->CheckNodeAccess("read", $links))
      {
        $out_node_id_list[] = $node_id;
      }
    }
  }
  
  public function ActionFetchNodes($in_node_id_list, &$out_node_list)
  {
    $db = $this->GetDb();

    $out_node_list = array();
    $node_list = $this->FetchNodes($db, $in_node_id_list);

    foreach ($node_list as $node)
    {
      if ($node["type"] == "user")
      {
        foreach ($node["attributes"] as $key => $attribute)
        {
          if ($attribute["name"] == "Password")
          {
            $node["attributes"][$key]["value"] = "";
          }
        }
      }

      if ($_SESSION["Modules"]["user"]->CheckNodeAccess("read", $node["links"]))
      {
        $out_node_list[] = $node;
      } 
    }
  }
  
  public function ActionFetchPositions($in_query, &$out_position_list)
  {
    $db = $this->GetDb();

    $out_position_list = $this->FetchPositions($db, $in_query);
  }
   
  public function ActionUploadFile($in_id, $in_last_chunk, $in_sha1, &$out_metadata)
  {
    global $murrix_temporary_upload_prefix;
  
    $out_metadata = array();

    if (isset($_FILES["_FILE64_"]))
    {
      if ($_FILES["_FILE64_"]["error"] != UPLOAD_ERR_OK)
      {
        switch ($_FILES["_FILE64_"]["error"])
        {
          case UPLOAD_ERR_INI_SIZE:      throw new Exception("The uploaded file exceeds the upload_max_filesize directive in php.ini.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_FORM_SIZE:     throw new Exception("The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_PARTIAL:       throw new Exception("The uploaded file was only partially uploaded.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_NO_FILE:       throw new Exception("No file was uploaded.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_NO_TMP_DIR:    throw new Exception("Missing a temporary folder. Introduced in PHP 4.3.10 and PHP 5.0.3.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_CANT_WRITE:    throw new Exception("Failed to write file to disk. Introduced in PHP 5.1.0.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_EXTENSION:     throw new Exception("A PHP extension stopped the file upload. PHP does not provide a way to ascertain which extension caused the file upload to stop; examining the list of loaded extensions with phpinfo() may help. Introduced in PHP 5.2.0.", MURRIX_RESULT_CODE_FAILURE);
          default:                       throw new Exception("Unknown error occured.", MURRIX_RESULT_CODE_FAILURE);
        }
      }
    
      $data = file_get_contents($_FILES["_FILE64_"]['tmp_name']);
      $data = base64_decode($data);
    }
    else
    {
      if ($_FILES["_FILE_"]["error"] != UPLOAD_ERR_OK)
      {
        switch ($_FILES["_FILE_"]["error"])
        {
          case UPLOAD_ERR_INI_SIZE:      throw new Exception("The uploaded file exceeds the upload_max_filesize directive in php.ini.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_FORM_SIZE:     throw new Exception("The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_PARTIAL:       throw new Exception("The uploaded file was only partially uploaded.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_NO_FILE:       throw new Exception("No file was uploaded.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_NO_TMP_DIR:    throw new Exception("Missing a temporary folder. Introduced in PHP 4.3.10 and PHP 5.0.3.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_CANT_WRITE:    throw new Exception("Failed to write file to disk. Introduced in PHP 5.1.0.", MURRIX_RESULT_CODE_FAILURE);
          case UPLOAD_ERR_EXTENSION:     throw new Exception("A PHP extension stopped the file upload. PHP does not provide a way to ascertain which extension caused the file upload to stop; examining the list of loaded extensions with phpinfo() may help. Introduced in PHP 5.2.0.", MURRIX_RESULT_CODE_FAILURE);
          default:                       throw new Exception("Unknown error occured.", MURRIX_RESULT_CODE_FAILURE);
        }
      }
      
      $data = file_get_contents($_FILES["_FILE_"]['tmp_name']);
    }
    
    /*if ($in_sha1 != sha1($data))
    {
      throw new Exception("Checksums do not match:$in_sha1 == " . sha1($data), MURRIX_RESULT_CODE_CHECKSUM_MISMATCH);
    }*/
    
    $filename = $murrix_temporary_upload_prefix . $in_id;

    $file = fopen($filename, "a+");
    
    if ($file === FALSE)
    {
      throw new Exception("Could not open temporary file for writing.", MURRIX_RESULT_CODE_FILE_NOT_WRITABLE);
    }
      
    fwrite($file, $data);
    
    fclose($file);

    if (filter_var($in_last_chunk, FILTER_VALIDATE_BOOLEAN))
    {
      $out_metadata = Murrix_GetExifData($filename);
      
      $this->uploaded_files[$in_id] = $filename;
    }
  }
}

?>