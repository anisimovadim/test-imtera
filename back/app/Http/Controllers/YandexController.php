<?php

namespace App\Http\Controllers;

use App\Models\UserSetting;
use App\Services\YandexScraperService;
use Carbon\Carbon;
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
    public function saveReviews(Request $request)
    {
        $user = $request->user();
        $newLink = $request->input('url');

        if (!$newLink) {
            return response()->json(['error' => 'Ссылка на Яндекс.Карты не указана'], 400);
        }

        $userSetting = $user->settings;

        if ($userSetting && $userSetting->link === $newLink) {
            return response()->json([
                'message' => 'Ссылка уже активирована',
                'count' => $userSetting->comments()->count()
            ]);
        }

        if ($userSetting) {
            $userSetting->comments()->detach();
            $userSetting->update(['link' => $newLink]);
        }
        else {
            $userSetting = UserSetting::create([
                'user_id' => $user->id,
                'link' => $newLink,
                'filial_name' => '',
                'total_reviews' => '0',
                'average_rating' => '0'
            ]);
        }

        $data = $this->service->getReviews($newLink);

        if (!isset($data['reviews'])) {
            return response()->json(['error' => 'Не удалось получить отзывы'], 500);
        }

        $commentsToAttach = [];

        foreach ($data['reviews'] as $review) {
            $date = isset($review['date']) ? Carbon::parse($review['date'])->toDateTimeString() : null;

            $comment = \App\Models\Comment::create([
                'author' => $review['author'] ?? null,
                'rating' => $review['rating'] ?? null,
                'date' => $date,
                'text' => $review['text'] ?? null,
            ]);
            $commentsToAttach[] = $comment->id;
        }

        $userSetting->comments()->attach($commentsToAttach);

        $userSetting->update([
            'filial_name' => $data['filial_name'],
            'total_reviews' => $data['total_reviews'],
            'average_rating' => $data['average_rating'] ?? '0',
            ]);

        return response()->json([
            'message' => 'Комментарии сохранены',
            'userSetting' => UserSetting::with('comments')->find($userSetting->id)
        ]);
    }
}
