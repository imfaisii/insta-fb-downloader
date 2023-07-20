<?php

use App\Services\ExtractService;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Route;
use Spatie\Browsershot\Browsershot;

use function App\Helpers\get_string_between;

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
    $html = Browsershot::url('https://www.facebook.com/watch?v=734316828376137')
        ->waitUntilNetworkIdle()
        ->bodyHtml();
    try {
        $links = ExtractService::facebook($html);
    } catch (\Exception $exception) {
        dd($exception->getMessage());
    }

    dd($links);
    return view('welcome');
});
