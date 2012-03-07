<?

function _array_prefix_values_walker(&$item1, $key, $prefix)
{
    $item1 = $prefix . $item1;
}

function array_prefix_values($list, $prefix)
{
  array_walk($list, "_array_prefix_values_walker", $prefix);
  return $list;
}

?>