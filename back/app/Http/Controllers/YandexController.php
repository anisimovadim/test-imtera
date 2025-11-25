<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class YandexController extends Controller
{
    public function reviews(Request $request)
    {
        $url = $request->input('url');
        if (!$url) {
            return response('URL не передан', 400);
        }

        $nodePath = '/usr/bin/node';
        $scriptPath = '/var/www/test-imtera/back/external-script/yandex_reviews.js';

        $command = $nodePath . ' ' . $scriptPath . ' ' . escapeshellarg($url);

        $output = [];
        $returnVar = null;

        exec($command, $output, $returnVar);

        return response(implode("\n", $output), 200)
            ->header('Content-Type', 'text/plain; charset=utf-8');
    }
}
