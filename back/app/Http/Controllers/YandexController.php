<?php

namespace App\Http\Controllers;

use App\Services\YandexScraperService;
use Illuminate\Http\Request;

class YandexController extends Controller
{
    protected YandexScraperService $service;

    public function __construct(YandexScraperService $service)
    {
        $this->service = $service;
    }

    /**
     * Возвращает JSON с отзывами для Vue
     */
    public function getReviews(Request $request)
    {
        $url = $request->user()->setting?->yandex_map_url ?? $request->input('url');

        if (!$url) {
            return response()->json(['error' => 'Ссылка на Яндекс.Карты не указана'], 400);
        }

        $data = $this->service->getReviews($url);

        return response()->json($data);
    }
}
