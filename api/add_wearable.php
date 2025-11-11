<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json; charset=utf-8");

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

require_once __DIR__ . "/config.php";

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$body = json_decode(file_get_contents("php://input"), true);

$date = trim($body["date"] ?? "");
$steps = $body["steps"] ?? null;
$heart = $body["heart_rate"] ?? null;
$hrv   = $body["hrv"] ?? null;

if ($date === "") {
    echo json_encode(["error" => "Date required"]);
    exit;
}

try {
    $user_id = 2; // ✅ match your get_wearables.php (so data shows up for the same user)
    $ts = date("Y-m-d 00:00:00", strtotime($date));
    $insert = $pdo->prepare("INSERT INTO wearable_readings (user_id, ts, metric, value) VALUES (?, ?, ?, ?)");

    $pdo->beginTransaction();
    $count = 0;

    // ✅ use consistent metrics with your ENUM('hrv','resting_hr','steps')
    if (is_numeric($steps)) {
        $insert->execute([$user_id, $ts, "steps", $steps]);
        $count++;
    }
    if (is_numeric($heart)) {
        $insert->execute([$user_id, $ts, "resting_hr", $heart]);
        $count++;
    }
    if (is_numeric($hrv)) {
        $insert->execute([$user_id, $ts, "hrv", $hrv]);
        $count++;
    }

    $pdo->commit();
    echo json_encode(["status" => "ok", "rows_added" => $count], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["status" => "error", "error" => $e->getMessage()]);
}
?>
