<?php
// ---------------- CORS (Vite dev / local previews) ----------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
  header("Access-Control-Allow-Origin: $origin");
  header('Access-Control-Allow-Credentials: true');
  header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (!function_exists('lh_load_env_file')) {
  function lh_load_env_file($path) {
    if (!is_readable($path)) {
      return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
      $line = trim($line);
      if ($line === '' || strpos($line, '#') === 0) {
        continue;
      }
      [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
      $key = trim($key);
      if ($key === '') {
        continue;
      }
      $value = trim($value);
      if ($value !== '' && ($value[0] === '"' || $value[0] === "'") && substr($value, -1) === $value[0]) {
        $value = substr($value, 1, -1);
      }
      if (!array_key_exists($key, $_ENV)) {
        $_ENV[$key] = $value;
      }
      if (!array_key_exists($key, $_SERVER)) {
        $_SERVER[$key] = $value;
      }
      if (getenv($key) === false) {
        putenv("$key=$value");
      }
    }
  }
}

$envFiles = [
  dirname(__DIR__) . '/.env.local',
  dirname(__DIR__) . '/.env',
  __DIR__ . '/.env.local',
  __DIR__ . '/.env',
  dirname(__DIR__) . '/.env.example',
  __DIR__ . '/.env.example',
];
foreach ($envFiles as $envFile) {
  lh_load_env_file($envFile);
}

if (!function_exists('lh_env_value')) {
  function lh_env_value($key) {
    $value = $_ENV[$key] ?? getenv($key);
    $value = is_string($value) ? trim($value) : '';
    return $value !== '' ? $value : null;
  }
}

if (!function_exists('lh_is_placeholder_key')) {
  function lh_is_placeholder_key($value) {
    $lower = strtolower($value);
    if ($lower === '' || strpos($lower, 'your') !== false) {
      return true;
    }
    $known = ['change-me', 'gemini_api_key'];
    return in_array($lower, $known, true);
  }
}

$geminiKey = lh_env_value('GEMINI_API_KEY');
if (!defined('GEMINI_API_KEY') && $geminiKey && !lh_is_placeholder_key($geminiKey)) {
  define('GEMINI_API_KEY', $geminiKey);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// --------------- Session ----------------
if (session_status() !== PHP_SESSION_ACTIVE) {
  // SameSite=None is required for cross-origin cookies (Vite → MAMP)
  session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'None',
    'secure'   => false,   // set true if you serve https
  ]);
  session_start();
}

// --------------- Timezone ----------------
$configuredTz = ini_get('date.timezone');
$localTz = $configuredTz ?: date_default_timezone_get();
date_default_timezone_set($localTz);

// --------------- DB (MAMP defaults) ---------------
$host = "localhost";
$port = "8889";
$db   = "longevityhub";
$user = "root";
$pass = "root";

try {
  $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  $pdo->exec("SET time_zone = " . $pdo->quote(date('P')));
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'db_connect_failed','details'=>$e->getMessage()]);
  exit;
}
