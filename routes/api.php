<?php

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process as SymphonyProcess;

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

        $platform = $data['platform'];

        $process = new SymphonyProcess(['python', public_path('/scripts/main.py'), json_encode($data)]);
        $process->run();

        // executes after the command finishes
        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }

        $data = $process->getOutput();

        if ($platform == "instagram") {
            return response()->json([
                'status' => true,
                'message' => 'Scrapped successfully',
                'data' => $data
            ]);
        }

        while (strpos($data, '\\\\') !== false) {
            $data = stripslashes($data);
        }

        $links = json_decode(substr(str_replace("\r\n", "", $data), 1, -1));
        $outputFileName = '';
        $mp4 = '';
        $mp3 = '';

        foreach ($links as $key => $link) {

            if ($mp4 == '' && Str::startsWith($link->mime_type, 'video/')) {
                $mp4 =  $link->base_url;
            }

            if ($mp3 == '' && $link->mime_type == 'audio/mp4') {
                $mp3 =  $link->base_url;
            }
        }

        if (filled($mp4) && filled($mp3)) {
            $audioFileName = Str::random(20) . ".mp4";
            $videoFileName = Str::random(20) . ".mp4";
            $outputFileName = Str::random(30) . ".mp4";
            $outputFile = Storage::disk('public')->path($outputFileName);
            $audioFile = Storage::disk('public')->path($audioFileName);
            $videoFile = Storage::disk('public')->path($videoFileName);
            Storage::disk('public')->put($videoFileName, file_get_contents($mp4));
            Storage::disk('public')->put($audioFileName, file_get_contents($mp3));

            // Combine audio and video using FFmpeg
            $ffmpegCommand = "C:\\ffmpeg\\bin\\ffmpeg.exe -i $videoFile -i $audioFile -c:v copy -c:a aac -strict experimental $outputFile";
            Process::run($ffmpegCommand);

            Storage::disk('public')->delete($audioFileName);
            Storage::disk('public')->delete($videoFileName);
        }

        return response()->json([
            'status' => true,
            'message' => 'Scrapped successfully',
            'data' => filled($outputFileName) ? ("http://" . request()->httpHost() . "/storage/" . $outputFileName) : (filled($mp4) ? $mp4 : 'Error')
        ]);
    } catch (Exception $ex) {
        return response()->json([
            'status' => false,
            'message' => $ex->getMessage(),
        ]);
    }
});

Route::post('/testlinks', function (Request $request) {
    try {
        $data = $request->validate([
            'url' => 'required|url',
            'platform' => 'required|in:facebook,instagram',
        ]);

        if ($data['platform'] == "facebook") {
            $process = new Process(['python', public_path('/scripts/testfb.py'), json_encode($data)]);
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

Route::post('/storiestestlinks', function (Request $request) {
    try {
        $data = $request->validate([
            'url' => 'required|url',
            'platform' => 'required|in:facebook,instagram',
        ]);

        if ($data['platform'] == "facebook") {
            $process = new Process(['python', public_path('/scripts/fb_story.py'), json_encode($data)]);
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
