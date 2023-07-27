<?php

use Illuminate\Support\Facades\Route;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

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
    $process = new Process(['python', public_path('/scripts/fb.py')]);
    $process->run();

    // executes after the command finishes
    if (!$process->isSuccessful()) {
        throw new ProcessFailedException($process);
    }

    $data = $process->getOutput();
    $fixedString = $data;
    while (strpos($fixedString, '\\\\') !== false) {
        $fixedString = stripslashes($fixedString);
    }
    dump(substr(str_replace("\r\n", "", $fixedString), 1, -1));
    dd(json_decode(substr(str_replace("\r\n", "", $fixedString), 1, -1)));
});
