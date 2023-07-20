<?php

namespace App\Helpers;

function get_string_between($string, $start, $end, $inclusive = false)
{
    $string = ' ' . $string;
    $ini = strpos($string, $start);
    if ($ini == 0) return '';
    $ini += strlen($start);
    $len = strpos($string, $end, $ini) - $ini;
    $subStr = substr($string, $ini, $len);

    if ($inclusive) {
        return "{$start}{$subStr}{$end}";
    }

    return $subStr;
}
