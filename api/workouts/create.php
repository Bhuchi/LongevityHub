<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173'); // Vite dev
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once "../config.php";

$input = json_decode(file_get_contents("php://input"), true);
$user_id = $input["user_id"] ?? 1;
$minutes = (int)($input["minutes"] ?? 0);
$effort = (int)($input["effort"] ?? 0);
$started_at = $input["started_at"] ?? "";
$note = trim($input["notes"] ?? "");

if (!$minutes || !$started_at) {
  echo json_encode(["ok" => false, "error" => "Missing minutes or started_at"]);
  exit;
}

$intensity = "easy";
if ($effort >= 80) $intensity = "hard";
elseif ($effort >= 50) $intensity = "moderate";

$dt = str_replace("T", " ", substr($started_at, 0, 16)) . ":00";

$stmt = $pdo->prepare("INSERT INTO workouts (user_id, started_at, duration_min, intensity, note)
                       VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$user_id, $dt, $minutes, $intensity, $note]);

$id = $pdo->lastInsertId();

echo json_encode([
  "ok" => true,
  "workout" => [
    "workout_id" => $id,
    "user_id" => $user_id,
    "started_at" => $dt,
    "duration_min" => $minutes,
    "intensity" => $intensity,
    "note" => $note
  ]
]);
