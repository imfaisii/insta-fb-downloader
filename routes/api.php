<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/links', function (Request $request) {
    try {
        $data = $request->validate([
            'url' => 'required|url',
            'platform' => 'required|in:facebook,instagram',
        ]);

        if ($data['platform'] == "instagram") {
            $process = new Process(['python', resource_path('/js/app.mjs'), json_encode($data)]);
            $process->run();
        } else {
            $process = new Process(['python', public_path('/scripts/fb.py'), json_encode($data)]);
            $process->run();
        }

        // executes after the command finishes
        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }

        $data = $process->getOutput();

        while (strpos($data, '\\\\') !== false) {
            $data = stripslashes($data);
        }

        return response()->json([
            'status' => true,
            'message' => 'scrapped successfully',
            'data' => json_decode(substr(str_replace("\r\n", "", $data), 1, -1))
        ]);
    } catch (Exception $ex) {
        return response()->json([
            'status' => false,
            'message' => $ex->getMessage(),
        ]);
    }
});


Route::post('/scrap', function (Request $request) {

    $data = $request->validate([
        'url' => 'required|url',
        'platform' => 'required|in:facebook,instagram',
    ]);

    $process = new Process([
        'node',
        'C:\laragon\www\insta-fb-downloader\resources\js\app.mjs',
        json_encode($data)
    ]);
    $process->run();

    if (!$process->isSuccessful()) {
        throw new ProcessFailedException($process);
    }

    $response = $process->getOutput();

    $response = str_replace("\n", "", $response);
    $response = str_replace("'", '"', $response);
    $response = str_replace("  ", '', $response);

    $response = preg_replace('/(?<!")\b(\w+)\b(?=:)/', '"$1"', $response);

    return response()->json(json_decode($response));
});
