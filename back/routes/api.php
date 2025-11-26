<?php

use App\Models\UserSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/register', [\App\Http\Controllers\AuthController::class, 'register']);
Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);
Route::get('/test', [\App\Http\Controllers\AuthController::class, 'test']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/reviews', [\App\Http\Controllers\YandexController::class, 'getReviews']);
    Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout']);
    Route::get('/user', function () {
        $userId = auth()->id();
        $userSetting = UserSetting::with('comments', 'user')->where('user_id', $userId)->first();
        if ($userSetting){
            return response()->json($userSetting);
        }
        return \App\Models\User::query()->where('id', $userId)->first();
    });
});
