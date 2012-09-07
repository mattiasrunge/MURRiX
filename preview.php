<?

$nodeId = intval($_GET['nodeId']);
$width = intval($_GET['width']);
$height = intval($_GET['height']);

$filename = $nodeId . "_" . $width . "x" . $height . ".jpg";

function getAttribute($node, $attributeName)
{
  foreach ($node["attributes"] as $attribute)
  {
    if ($attribute["name"] == $attributeName)
    {
      return $attribute["value"];
    }
  }

  return false;
}

function isAttribute($node, $attributeName)
{
  foreach ($node["attributes"] as $attribute)
  {
    if ($attribute["name"] == $attributeName)
    {
      return true;
    }
  }

  return false;
}

if (!file_exists(dirname(__FILE__) . "/previews2/" . $filename))
{
  require_once("murrix/murrix.base.php");

  $originalFilename = dirname(__FILE__) . "/files2/" . $nodeId;

  if (!file_exists($originalFilename))
  {
    header("HTTP/1.0 404 Not Found");
    return;
  }

  $node = $_SESSION["Modules"]["db"]->FetchNode($_SESSION["Modules"]["db"]->GetDb(), $nodeId);

  if ($node["type"] != "file")
  {
    header("HTTP/1.0 404 Not Found - file");
    return;
  }

  $extension = strtolower(pathinfo($node["name"], PATHINFO_EXTENSION));

  switch (getAttribute($node, "MetaMIMEType"))
  {
    case "video/mpeg":
    case "video/avi":
    case "video/quicktime":
    case "video/x-ms-wmv":
    case "video/mp4":
    case "video/3gpp":
    {
      $tempfile2 = "/tmp/videoconvert" . time() . $nodeId;

      $options = "";

      if (isAttribute($node, "MetaCompression") && getAttribute($node, "MetaCompression") == "dvsd")
      {
        $options .= " -deinterlace";
      }

      if (isAttribute($node, "ThumbPosition"))
      {
        $options .= " -ss " . getAttribute($node, "ThumbPosition");
      }

      $commandline = "ffmpeg -i " . $filename . $options . " -y -an -sameq " . $tempfile2;

      exec($commandline);

      if (!file_exists($tempfile))
      {
        header("HTTP/1.0 404 Not Found - video");
        return;
      }

      $originalFilename = $tempfile2;

      // Fall through for images
    }
    case "image/jpeg":
    case "image/gif":
    case "image/tiff":
    case "image/png":
    case "image/bmp":
    case "image/x-raw":
    {
      $tempfile = "/tmp/imageconvert" . time() . $nodeId;

      $options = "";

      if (isAttribute($node, "Angle"))
      {
        $options .= " -rotate " . (-intval(getAttribute($node, "Angle"))) . " +repage";
      }

      if (isAttribute($node, "Mirror") && intval(getAttribute($node, "Mirror")) === 1)
      {
        $options .= " -flop +repage";
      }

      if ($width == $height)
      {
        $options .= " -resize " . $width . "x" . $height . "^ +repage";
        $options .= " -gravity center -crop " . $width . "x" . $height . "+0+0";
      }
      else
      {
        $options .= " -resize " . $width . "x" . $height . " +repage";
      }

      if ($extension == "cr2")
      {
        $originalFilename = "cr2:" . $originalFilename;
      }

      $commandline = "convert " . $originalFilename . " " . $options . " -strip -format jpg -quality 91 " . $tempfile;

      exec($commandline);

      if (!file_exists($tempfile))
      {
        header("HTTP/1.0 404 Not Found - image");
        return;
      }

      if (!rename($tempfile, dirname(__FILE__) . "/previews2/" . $filename))
      {
        header("HTTP/1.0 404 Not Found - copy");
        return;
      }

      break;
    }
    default:
    {
      header("HTTP/1.0 404 Not Found - type: " . getAttribute($node, "MetaMIMEType"));
      return;
    }
  }
}

header("Content-Type: image/jpeg");
echo @readfile(dirname(__FILE__) . "/previews2/" . $filename);

?>