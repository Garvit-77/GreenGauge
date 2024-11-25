<?php

use Illuminate\Support\Facades\Route;
use App\Livewire\Counter;
 
Route::get('/chatbot', Counter::class);

Route::view('/', 'welcome');

Route::view('dashboard', 'dashboard')
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::view('profile', 'profile')
    ->middleware(['auth'])
    ->name('profile');

// Route::get('/chatbot', function(){
//     return view('chatbotView');
// });

require __DIR__.'/auth.php';
