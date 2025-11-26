<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSettingComment extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_setting_id',
        'comment_id',
    ];
}
