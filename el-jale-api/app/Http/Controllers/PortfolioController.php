<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\ExpertPortfolioPhoto;
use App\Models\ExpertProfile;
use Illuminate\Support\Facades\Storage;

class PortfolioController extends Controller
{
    public function index(Request $request)
    {
        $user    = $request->user();
        $profile = ExpertProfile::where('user_id', $user->id)->firstOrFail();
        return response()->json($profile->portfolio()->latest()->get());
    }

    public function store(Request $request)
    {
        $user    = $request->user();
        if ($user->role !== 'expert') return response()->json(['message' => 'Acceso denegado'], 403);

        $profile = ExpertProfile::where('user_id', $user->id)->firstOrFail();
        if ($profile->portfolio()->count() >= 12)
            return response()->json(['message' => 'Máximo 12 fotos en el portfolio'], 400);

        $request->validate([
            'photos'    => 'required|array|min:1|max:6',
            'photos.*'  => 'image|max:5120',
            'captions'  => 'nullable|array',
        ]);

        $created = [];
        foreach ($request->file('photos') as $i => $photo) {
            $path = $photo->store('portfolio', 'public');
            $created[] = ExpertPortfolioPhoto::create([
                'expert_profile_id' => $profile->id,
                'photo_path'        => $path,
                'caption'           => $request->captions[$i] ?? null,
            ]);
        }
        return response()->json($created, 201);
    }

    public function destroy(Request $request, $id)
    {
        $user    = $request->user();
        $profile = ExpertProfile::where('user_id', $user->id)->firstOrFail();
        $photo   = ExpertPortfolioPhoto::where('id', $id)
            ->where('expert_profile_id', $profile->id)->firstOrFail();

        Storage::disk('public')->delete($photo->photo_path);
        $photo->delete();
        return response()->json(['message' => 'Foto eliminada.']);
    }
}
