<?php
// ✅ Gemini API Key
define('GEMINI_API_KEY', 'AIzaSyBubUcTXG_cLXy8F2c0SoGzKHk-B0nZBhk');

// ✅ Database connection (MAMP)
$host = "localhost";
$db   = "longevityhub";
$user = "root";
$pass = "root"; // default for MAMP

try {
  $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
} catch (PDOException $e) {
  echo json_encode(["error" => "Database connection failed", "details" => $e->getMessage()]);
  exit;
}
?>