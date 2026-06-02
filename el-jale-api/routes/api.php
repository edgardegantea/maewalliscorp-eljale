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
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\JobBidController;
use App\Http\Controllers\DisputeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MercadoPagoController;
use App\Http\Controllers\IdentityVerificationController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\InvoiceController;

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

// Webhooks públicos (sin autenticación)
Route::post('/mp/webhook',            [MercadoPagoController::class, 'webhook']);
Route::post('/subscriptions/webhook', [SubscriptionController::class, 'webhook']);

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

    // Perfil del experto
    Route::put('/expert-profile', [ExpertProfileController::class, 'update']);
    Route::post('/expert-profile/availability', [ExpertProfileController::class, 'toggleAvailability']);
    Route::post('/expert-profile/onboarding-complete', [ExpertProfileController::class, 'completeOnboarding']);
    Route::get('/my-stats', [ExpertProfileController::class, 'myStats']);

    // Portfolio del experto
    Route::get('/portfolio',        [PortfolioController::class, 'index']);
    Route::post('/portfolio',       [PortfolioController::class, 'store']);
    Route::delete('/portfolio/{id}',[PortfolioController::class, 'destroy']);

    // Favoritos del cliente
    Route::get('/favorites',               [FavoriteController::class, 'index']);
    Route::post('/favorites/{expertId}',   [FavoriteController::class, 'toggle']);
    Route::get('/favorites/{expertId}/check', [FavoriteController::class, 'check']);

    // Cotizaciones (bids)
    Route::get('/jobs/{id}/bids',           [JobBidController::class, 'index']);
    Route::post('/jobs/{id}/bids',          [JobBidController::class, 'store']);
    Route::post('/jobs/{id}/bids/{bidId}/accept', [JobBidController::class, 'accept']);
    Route::get('/my-bids',                  [JobBidController::class, 'myBids']);

    // Disputas
    Route::post('/jobs/{id}/dispute', [DisputeController::class, 'store']);
    Route::get('/jobs/{id}/dispute',  [DisputeController::class, 'show']);

    // Estadísticas del cliente
    Route::get('/client-stats', [ServiceJobController::class, 'clientStats']);

    // Verificación de identidad (KYC)
    Route::post('/kyc/documents',             [IdentityVerificationController::class, 'submitDocuments']);
    Route::get('/kyc/status',                 [IdentityVerificationController::class, 'myStatus']);
    Route::get('/admin/kyc/{userId}',         [IdentityVerificationController::class, 'getDocuments']);
    Route::post('/admin/kyc/{userId}/approve',[IdentityVerificationController::class, 'approve']);
    Route::post('/admin/kyc/{userId}/reject', [IdentityVerificationController::class, 'reject']);

    // Membresía Premium
    Route::get('/subscription/status',      [SubscriptionController::class, 'status']);
    Route::post('/subscription/preference', [SubscriptionController::class, 'createPreference']);

    // Facturas PDF
    Route::get('/jobs/{id}/invoice',        [InvoiceController::class, 'download']);

    // MercadoPago
    Route::post('/jobs/{id}/mp/preference',      [MercadoPagoController::class, 'createPreference']);
    Route::get('/jobs/{id}/mp/status',            [MercadoPagoController::class, 'checkStatus']);
    Route::post('/jobs/{id}/mp/release',          [MercadoPagoController::class, 'releasePayment']);
    Route::post('/jobs/{id}/mp/refund',           [MercadoPagoController::class, 'refundPayment']);
    Route::get('/mp/public-key',                  fn() => response()->json(['public_key' => config('mercadopago.public_key')]));

    // Centro de notificaciones
    Route::get('/notifs',              [NotificationController::class, 'index']);
    Route::get('/notifs/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifs/{id}/read',   [NotificationController::class, 'markRead']);
    Route::post('/notifs/read-all',    [NotificationController::class, 'markAllRead']);

    // --- Calificaciones ---
    Route::post('/jobs/{id}/review', [ReviewController::class, 'store']);

    // --- Chat por trabajo ---
    Route::get('/jobs/{id}/messages', [MessageController::class, 'index']);
    Route::post('/jobs/{id}/messages', [MessageController::class, 'store']);

    // --- Panel de Administración ---
    Route::prefix('admin')->group(function () {
        Route::get('/stats',                     [AdminController::class, 'stats']);

        Route::get('/users',                     [AdminController::class, 'users']);
        Route::get('/users/{id}',                [AdminController::class, 'userDetail']);
        Route::post('/users/{id}/toggle',        [AdminController::class, 'toggleUser']);

        Route::get('/jobs',                      [AdminController::class, 'jobs']);
        Route::get('/jobs/{id}',                 [AdminController::class, 'jobDetail']);

        Route::get('/payments',                  [AdminController::class, 'payments']);

        Route::get('/export/jobs',               [AdminController::class, 'exportJobs']);
        Route::get('/export/users',              [AdminController::class, 'exportUsers']);
        Route::get('/disputes',                  [AdminController::class, 'disputes']);
        Route::put('/disputes/{id}',             [AdminController::class, 'resolveDispute']);

        Route::post('/experts/{userId}/verify',  [AdminController::class, 'verifyExpert']);
        Route::post('/experts/{userId}/reject',  [AdminController::class, 'rejectExpert']);
    });

});