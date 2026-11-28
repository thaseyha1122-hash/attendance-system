<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->prepend([
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\NormalizeSimpleApiRequest::class,
        ]);
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\NormalizeSimpleApiRequest::class,
        ]);
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
            'permission' => \App\Http\Middleware\EnsurePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

// Use project-root .env when running locally (monorepo layout).
// Always force-load from the root .env (mutable) so stale parent process
// environment variables (e.g. from php artisan serve or IDE terminals)
// cannot override the values in .env.
$rootEnvPath = dirname(__DIR__, 2);
if (is_file($rootEnvPath.DIRECTORY_SEPARATOR.'.env')) {
    $app->useEnvironmentPath($rootEnvPath);
    $mutableRepo = \Dotenv\Repository\RepositoryBuilder::createWithDefaultAdapters()
        ->addAdapter(\Dotenv\Repository\Adapter\PutenvAdapter::class)
        ->make();
    \Dotenv\Dotenv::create($mutableRepo, $rootEnvPath, '.env')->safeLoad();
}

return $app;
