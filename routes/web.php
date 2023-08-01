<?php

use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/test', function () {
    $result = Process::run('python "' . public_path("/scripts/fb.py") . '"');

    dd($result->output());

    // dd($data);
    // $fixedString = $data;
    // while (strpos($fixedString, '\\\\') !== false) {
    //     $fixedString = stripslashes($fixedString);
    // }
    // dump(substr(str_replace("\r\n", "", $fixedString), 1, -1));
    // dd(json_decode(substr(str_replace("\r\n", "", $fixedString), 1, -1)));
});
