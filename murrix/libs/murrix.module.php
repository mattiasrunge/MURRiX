<?

require_once("murrix/libs/murrix.result-codes.php");


class MurrixModule
{
  protected $actions = array();
 
  public function registerAction($name, $function, $input, $output)
  {
    $this->actions[$name] = array("Function"  => $function,
                                  "Input"     => $input,
                                  "Output"    => $output);
  }
  
  public function callAction($name, $input_data, &$output_data)
  {
    /* Check if we have the requested action */ 
    if (!array_key_exists($name, $this->actions))
    {
      throw new Exception("Unknown parameter: \"Action\"", MURRIX_RESULT_CODE_PARAM);
    }
    
    
    /* Create argument array for action */
    $arguments = array();

    foreach ($this->actions[$name]["Input"] as $input)
    {
      if (!array_key_exists($input, $input_data))
      {
        throw new Exception("Missing parameter: \"" . $input . "\"", MURRIX_RESULT_CODE_PARAM);
      }
      
      $arguments[] = $input_data[$input];
    }
    
    foreach ($this->actions[$name]["Output"] as $output)
    {
      $arguments[] = &$output_data[$output];
    }
    
    
    /* Call the requested action */
    call_user_func_array($this->actions[$name]["Function"], $arguments);
  }
  
  public function getFrontendOptions()
  {
    return array();
  }
}


?>