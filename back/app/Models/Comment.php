<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'author',
        'rating',
        'date',
        'text',
    ];

    public function settings()
    {
        return $this->belongsToMany(UserSetting::class, 'user_setting_comments')
            ->withTimestamps();
    }
}
