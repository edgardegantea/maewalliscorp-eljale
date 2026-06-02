<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BadgeService;

class RecalculateBadges extends Command
{
    protected $signature   = 'badges:recalculate';
    protected $description = 'Recalcula los badges de todos los expertos verificados';

    public function handle(): void
    {
        $this->info('Recalculando badges...');
        BadgeService::recalculateAll();
        $this->info('Badges actualizados correctamente.');
    }
}
