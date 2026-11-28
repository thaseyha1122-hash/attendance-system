<?php

namespace App\Console\Commands;

use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand(name: 'serve')]
class ServeCommand extends BaseServeCommand
{
    /**
     * Execute the console command.
     *
     * Uses $this->laravel->environmentFilePath() (which respects useEnvironmentPath()
     * pointing to the monorepo root .env) instead of base_path('.env'), so that
     * `php artisan serve` properly clears stale parent $_ENV variables and auto-reloads
     * when the root .env file changes.
     */
    public function handle()
    {
        $environmentFile = $this->option('env')
            ? $this->laravel->environmentPath().DIRECTORY_SEPARATOR.'.env.'.$this->option('env')
            : $this->laravel->environmentFilePath();

        $hasEnvironment = file_exists($environmentFile);

        $environmentLastModified = $hasEnvironment
            ? filemtime($environmentFile)
            : now()->addDays(30)->getTimestamp();

        $process = $this->startProcess($hasEnvironment);

        while ($process->isRunning()) {
            if ($hasEnvironment) {
                clearstatcache(false, $environmentFile);
            }

            if (! $this->option('no-reload') &&
                $hasEnvironment &&
                filemtime($environmentFile) > $environmentLastModified) {
                $environmentLastModified = filemtime($environmentFile);

                $this->newLine();

                $this->components->info('Environment modified. Restarting server...');

                $process->stop(5);

                $this->serverRunningHasBeenDisplayed = false;

                $process = $this->startProcess($hasEnvironment);
            }

            usleep(500 * 1000);
        }

        $status = $process->getExitCode();

        if ($status && $this->canTryAnotherPort()) {
            $this->portOffset += 1;

            return $this->handle();
        }

        return $status;
    }
}
