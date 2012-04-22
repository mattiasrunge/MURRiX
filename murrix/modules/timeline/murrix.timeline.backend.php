<?

require_once("murrix/libs/murrix.utils.php");


class MurrixModuleTimeline extends MurrixModule
{
  protected $container_  = "";
  
  function __construct($options)
  {
    /* Initialize variables */
    $this->container_ = $options["container"];
  }

  
  /* Public methods */

  public function getFrontendOptions()
  {
    return array("container" => $this->container_);
  }
  
  /* Action functions */
  
  
}

?>