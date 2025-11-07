<?php
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

// ✅ Gemini API Key
define('GEMINI_API_KEY', 'AIzaSyBubUcTXG_cLXy8F2c0SoGzKHk-B0nZBhk');

// --- CORS for Vite dev server
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowed = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (in_array($origin, $allowed, true)) {
  header("Access-Control-Allow-Origin: $origin");
  header("Access-Control-Allow-Credentials: true");
  header("Vary: Origin");
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// ✅ Database connection (MAMP)
$host = "localhost";
$port = "8889";
$db = "longevityhub";
$user = "root";
$pass = "root"; // default for MAMP

try {
  $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(["ok" => false, "error" => "db_connect_failed", "details" => $e->getMessage()]);
  exit;
}
?>