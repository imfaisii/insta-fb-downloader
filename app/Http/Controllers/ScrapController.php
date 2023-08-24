<?php

namespace App\Http\Controllers;

use App\Http\Requests\GetScrapLinkRequest;
use Exception;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process as SymphonyProcess;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Process;

class ScrapController extends Controller
{
    //! DON't change, breaks the python script
    protected bool $showBrowser = false;
    protected bool $isUbuntu = true;
    protected string $binPath = '';

    public function __construct()
    {
        $this->binPath = $this->isUbuntu ? '/snap/bin/ffmpeg' : 'C:\\ffmpeg\\bin\\ffmpeg.exe';
    }

    public function __invoke(GetScrapLinkRequest $request)
    {
        try {

            if ($request->platform == "instagram" && Str::contains($request->url, "stories")) {

                $nodePath = trim(shell_exec("which node"));
                $fileName = Str::random(20);

                $command = "{$nodePath} " . public_path("scripts/node/app.js") . " '{$request->url}' {$fileName}";

                $story = Process::run($command);

                if ($story->failed()) {
                    dump($command);

                    return $this->response(status: false, data: $story->errorOutput());
                }

                $data = File::get(public_path("{$fileName}"));

                dd($data);
            }

            $process = new SymphonyProcess(['python3', public_path('/scripts/main.py'), json_encode($request->validated() + ['showBrowser' => $this->showBrowser])]);
            $process->run();

            // executes after the command finishes
            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }

            $data = $process->getOutput();

            if ($request->platform == "instagram") {
                return $this->response(data: $data);
            }

            while (strpos($data, '\\\\') !== false) {
                $data = stripslashes($data);
            }

            $links = json_decode(substr(str_replace("\r\n", "", $data), 1, -2));

            [$mp4, $mp3] = $this->getLinksFromData($links);

            $outputFileName = $this->getOutfileName($mp4, $mp3);

            if (filled($outputFileName)) {
                return $this->response(data: "http://" . request()->httpHost() . "/storage/" . $outputFileName);
            }

            return $this->response(status: !!filled($mp4), data: filled($mp4) ? $mp4 : 'Error');
        } catch (Exception $ex) {
            return $this->response(status: false, data: $ex->getMessage());
        }
    }

    protected function getLinksFromData(mixed $data): array
    {
        $mp4 = '';
        $mp3 = '';

        foreach ($data as $key => $link) {

            if ($mp4 == '' && Str::startsWith($link->mime_type, 'video/')) {
                $mp4 =  $link->base_url;
            }

            if ($mp3 == '' && Str::startsWith($link->mime_type, 'audio/')) {
                $mp3 =  $link->base_url;
            }
        }

        return [$mp4, $mp3];
    }

    protected function getOutfileName(string $mp4, string $mp3): string
    {
        if (!filled($mp4) || !filled($mp3)) {
            return '';
        }

        $audioFileName = Str::random(20) . ".mp4";
        $videoFileName = Str::random(20) . ".mp4";
        $outputFileName = Str::random(30) . ".mp4";
        $outputFile = Storage::disk('public')->path($outputFileName);
        $audioFile = Storage::disk('public')->path($audioFileName);
        $videoFile = Storage::disk('public')->path($videoFileName);

        // storing files locally to merge
        Storage::disk('public')->put($videoFileName, file_get_contents($mp4));
        Storage::disk('public')->put($audioFileName, file_get_contents($mp3));

        // Combine audio and video using FFmpeg
        $ffmpegCommand = "{$this->binPath} -i $videoFile -i $audioFile -c:v copy -c:a aac -strict experimental $outputFile";
        $cmd = Process::run($ffmpegCommand);

        if ($cmd->failed()) {
            throw new Exception("Error merging files");
        }

        // removing files
        Storage::disk('public')->delete($audioFileName);
        Storage::disk('public')->delete($videoFileName);

        return $outputFileName;
    }
}
