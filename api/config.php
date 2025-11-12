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
