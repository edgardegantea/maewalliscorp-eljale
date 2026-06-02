<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ServiceJobController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ExpertProfileController;

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

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

// Autenticación
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Catálogo de Oficios
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

// Explorar expertos verificados (con filtro por categoría)
Route::get('/experts', [ExpertProfileController::class, 'index']);
// Perfil público de experto
Route::get('/experts/{userId}', [ExpertProfileController::class, 'show']);


// ==========================================
// RUTAS PROTEGIDAS (Requieren Token Sanctum)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // --- Autenticación y Perfil ---
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/user', function (Request $request) {
        // Retorna el usuario autenticado cargando su perfil de experto (si tiene uno)
        return $request->user()->load('expertProfile');
    });

    // --- Administración de Categorías ---
    // (A futuro, es recomendable proteger estas 3 rutas con un middleware exclusivo para administradores)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // --- Gestión de Trabajos (Los Jales) ---
    // Clientes: Publicar un nuevo trabajo
    Route::post('/jobs', [ServiceJobController::class, 'store']);
    
    // Expertos: Explorar trabajos disponibles en su categoría
    Route::get('/jobs/available', [ServiceJobController::class, 'availableJobs']);

    // Clientes: Ver sus propios trabajos publicados
    Route::get('/jobs/my-jobs', [ServiceJobController::class, 'myJobs']);

    // Expertos: Ver sus trabajos aceptados
    Route::get('/jobs/my-active-jobs', [ServiceJobController::class, 'myActiveJobs']);
    
    // Notificaciones pendientes del usuario autenticado
    Route::get('/notifications', [ServiceJobController::class, 'notifications']);

    // Aceptar trabajo (experto)
    Route::post('/jobs/{id}/accept', [ServiceJobController::class, 'acceptJob']);

    // Experto sube fotos de evidencia
    Route::post('/jobs/{id}/expert-photos', [ServiceJobController::class, 'uploadExpertPhotos']);

    // Cliente libera el pago al confirmar que el trabajo terminó
    Route::post('/jobs/{id}/release-payment', [ServiceJobController::class, 'releasePayment']);

    // Cancelar trabajo (cliente o experto asignado)
    Route::post('/jobs/{id}/cancel', [ServiceJobController::class, 'cancelJob']);

    // Perfil del experto: actualizar bio y ver estadísticas
    Route::put('/expert-profile', [ExpertProfileController::class, 'update']);
    Route::get('/my-stats', [ExpertProfileController::class, 'myStats']);

    // --- Calificaciones ---
    Route::post('/jobs/{id}/review', [ReviewController::class, 'store']);

    // --- Chat por trabajo ---
    Route::get('/jobs/{id}/messages', [MessageController::class, 'index']);
    Route::post('/jobs/{id}/messages', [MessageController::class, 'store']);

    // --- Panel de Administración ---
    Route::prefix('admin')->group(function () {
        Route::get('/stats',                     [AdminController::class, 'stats']);
        Route::get('/users',                     [AdminController::class, 'users']);
        Route::get('/jobs',                      [AdminController::class, 'jobs']);
        Route::get('/payments',                  [AdminController::class, 'payments']);
        Route::post('/experts/{userId}/verify',  [AdminController::class, 'verifyExpert']);
        Route::post('/experts/{userId}/reject',  [AdminController::class, 'rejectExpert']);
    });

});