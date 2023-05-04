<?php

use Illuminate\Http\Request;
use Illuminate\Support\Str;
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


Route::post('/scrap', function (Request $request) {

    $data = $request->validate([
        'url' => 'required|url',
        'platform' => 'required|in:facebook,instagram',
    ]);

    if (
        Str::contains($request->get('url', ""), "facebook.com")
        || Str::contains($request->get('url', ""), "fb.watch")
    ) {
        $process = new Process([
            config('app.node.path'),
            config('app.node.script'),
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

        $process = new Process(['sudo pkill -9 -f ".vscode-server"']);

        $process->run();

        $process = new Process(['sudo pkill -9 -f "/linux-1108766/"']);

        $process->run();

        return response()->json(json_decode($response), 200);
    } else if (Str::contains($request->get('url', ""), "instagram.com")) {
        $process = new Process([
            config('app.python.path'),
            config('app.python.script'),
            $request->get('url')
        ]);

        $process->run();

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }

        $response = $process->getOutput();

        return response()->json([
            "bool" => true,
            "status" => "success",
            "code" => 200,
            "message" => "Action successful.",
            "data" => ["playable_url" => Str::replace("\r\n", "", $response)]
        ], 200);
    } else {
        return response()->json([
            'status' => 'failed',
            'message' => 'Invalid url, supported urls are of facebook and instagram only.'
        ], 422);
    }
});
