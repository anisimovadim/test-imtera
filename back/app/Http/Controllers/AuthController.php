<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function test(){
        return response()->json('Тест пройдлен');
    }
    public function register(Request $request)
    {
        $request->validate([
            'login' => 'required|string|unique:users,login|min:5|max:255',
            'password' => 'required|min:6',
            'account_name' => 'required|string|max:255|min:5',
        ]);

        $user = User::create([
            'login' => $request->login,
            'password' => Hash::make($request->password),
            'account_name' => $request->account_name,
        ]);

        return response()->json([
            'message' => 'Регистрация прошла успешно',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required',
            'password' => 'required'
        ]);
        if (!Auth::attempt(['login' => $request->login, 'password' => $request->password])) {
            return response()->json(['message' => 'Неверный логин или пароль'], 422);
        }

        $token = $request->user()->createToken('token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $request->user()
        ]);
    }
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Вы успешно вышли из аккаунта']);
    }
}
