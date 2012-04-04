<?

require_once("murrix.result-codes.php");

function _array_prefix_values_walker(&$item1, $key, $prefix)
{
    $item1 = $prefix . $item1;
}

function array_prefix_values($list, $prefix)
{
  array_walk($list, "_array_prefix_values_walker", $prefix);
  return $list;
}

function Murrix_GetExifData($filename)
{
  $exec_result = 1;

  if (!is_readable($filename))
  {
    throw new Exception($filename . " is not readable, please check permissions.", ERROR_CODE_FILE_NOT_READABLE);
  }
  
  exec("exiftool -d \"%Y-%m-%d %H:%M:%S\" '" . $filename . "'", $output, $exec_result);

  if ($exec_result != 0)
  {
    // Do fallback to php exif
    
    return array();
  }
  
  if (count($output) == 0)
  {
    return array();
  }
  
  if (strpos($output[0], "Error: Unknown file type") !== false)
  {
    return array();
  }
    
  if (strpos($output[0], "File not found") !== false)
  {
    throw new Exception($filename . " could not be found.", ERROR_CODE_FILE_NOT_FOUND);
  }
  
  $exif_data = array();
  
  foreach ($output as $row)
  {
    list($name, $value) = explode(":", $row, 2);
    
    $name = trim($name);
    $value = trim($value);
    
    $name = str_replace(array(" ", "/"), array("", ""), $name);
    
    if ($name == "Error")
    {
      return array();
    }
    
    $exif_data[$name] = $value;
  }
  
  return $exif_data;
}

?>