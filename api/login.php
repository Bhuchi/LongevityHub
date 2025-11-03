<?php
// login.php — LongevityHub
header("Content-Type: application/json");
require __DIR__ . "/config.php"; // should create $pdo = new PDO(...)

session_start();

$input = json_decode(file_get_contents("php://input"), true);
$email = trim($input["email"] ?? "");
$password = trim($input["password"] ?? "");

if (!$email || !$password) {
  http_response_code(400);
  echo json_encode(["error" => "Missing email or password"]);
  exit;
}

try {
  // Fetch user by email
  $stmt = $pdo->prepare("SELECT user_id, email, password_hash, full_name, role FROM users WHERE email = ?");
  $stmt->execute([$email]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user) {
    http_response_code(401);
    echo json_encode(["error" => "User not found"]);
    exit;
  }

  // ✅ Password check
  if (!password_verify($password, $user["password_hash"])) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid password"]);
    exit;
  }

  // ✅ Save session
  $_SESSION["user"] = [
    "user_id" => $user["user_id"],
    "email" => $user["email"],
    "role" => $user["role"],
    "full_name" => $user["full_name"]
  ];

  echo json_encode([
    "ok" => true,
    "user" => $_SESSION["user"]
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(["error" => $e->getMessage()]);
}
