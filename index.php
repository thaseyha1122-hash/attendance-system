<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

$isBackendRoute =
    $uri === '/api'
    || str_starts_with($uri, '/api/')
    || $uri === '/up'
    || str_starts_with($uri, '/sanctum/')
    || str_starts_with($uri, '/storage/');

$frontendDist = __DIR__.'/frontend/dist';
$frontendIndex = $frontendDist.'/index.html';

// Serve the built React frontend for non-API routes when available.
if (! $isBackendRoute && is_file($frontendIndex)) {
    if ($uri !== '/') {
        $distRoot = realpath($frontendDist);
        $candidate = realpath($frontendDist.$uri);

        if ($distRoot && $candidate && str_starts_with($candidate, $distRoot.DIRECTORY_SEPARATOR) && is_file($candidate)) {
            $ext = strtolower(pathinfo($candidate, PATHINFO_EXTENSION));
            $mimeTypes = [
                'html' => 'text/html; charset=UTF-8',
                'js' => 'application/javascript; charset=UTF-8',
                'mjs' => 'application/javascript; charset=UTF-8',
                'css' => 'text/css; charset=UTF-8',
                'json' => 'application/json; charset=UTF-8',
                'webmanifest' => 'application/manifest+json; charset=UTF-8',
                'svg' => 'image/svg+xml',
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                'ico' => 'image/x-icon',
                'woff2' => 'font/woff2',
                'wasm' => 'application/wasm',
                'bin' => 'application/octet-stream',
            ];

            header('Content-Type: '.($mimeTypes[$ext] ?? 'application/octet-stream'));
            readfile($candidate);
            exit;
        }
    }

    header('Content-Type: text/html; charset=UTF-8');
    readfile($frontendIndex);
    exit;
}

// Forward API / backend routes (or fallback when frontend/dist is not built) to Laravel.
$backend = __DIR__.'/backend';

if (file_exists($maintenance = $backend.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $backend.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $backend.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
