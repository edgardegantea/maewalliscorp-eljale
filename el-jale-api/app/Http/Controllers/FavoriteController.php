<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Favorite;
use App\Models\User;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $favs = Favorite::where('client_id', $user->id)
            ->with(['expert' => fn($q) => $q->with('expertProfile.category')])
            ->latest()->get()
            ->map(fn($f) => [
                'id'         => $f->expert->id,
                'name'       => $f->expert->name,
                'category'   => $f->expert->expertProfile?->category,
                'avg_rating' => $f->expert->expertProfile?->average_rating,
                'is_available' => $f->expert->expertProfile?->is_available,
            ]);
        return response()->json($favs);
    }

    public function toggle(Request $request, $expertId)
    {
        $user   = $request->user();
        $expert = User::where('role', 'expert')->findOrFail($expertId);

        $existing = Favorite::where('client_id', $user->id)->where('expert_id', $expertId)->first();
        if ($existing) {
            $existing->delete();
            return response()->json(['favorited' => false, 'message' => 'Eliminado de favoritos.']);
        }
        Favorite::create(['client_id' => $user->id, 'expert_id' => $expertId]);
        return response()->json(['favorited' => true, 'message' => 'Guardado en favoritos.']);
    }

    public function check(Request $request, $expertId)
    {
        $user = $request->user();
        $favorited = Favorite::where('client_id', $user->id)->where('expert_id', $expertId)->exists();
        return response()->json(['favorited' => $favorited]);
    }
}
