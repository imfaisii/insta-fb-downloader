<?php

namespace App\Services;

use Illuminate\Support\Arr;

use function App\Helpers\get_string_between;

class ExtractService
{
    protected const FACEBOOK_VIDEO_STRING_START = '[{"representations":';
    protected const FACEBOOK_VIDEO_STRING_END = ',"video_id"';

    public static function facebook(string $string): mixed
    {
        $json = json_decode(self::FACEBOOK_VIDEO_STRING_START . get_string_between($string, self::FACEBOOK_VIDEO_STRING_START, self::FACEBOOK_VIDEO_STRING_END) . "}]");

        return Arr::first($json)->representations;
    }
}
