<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json; charset=utf-8");

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . "/config.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["error" => "No file uploaded"]);
    exit;
}

$file = $_FILES['file']['tmp_name'];
if (!file_exists($file)) {
    echo json_encode(["error" => "File not found after upload"]);
    exit;
}

try {
    $handle = fopen($file, "r");
    if ($handle === false) throw new Exception("Cannot open uploaded file");

    // Skip header row
    $header = fgetcsv($handle);
    if (!$header) throw new Exception("Empty CSV file");

    $count = 0;
    $insert = $pdo->prepare("
        INSERT INTO wearable_readings (user_id, ts, metric, value)
        VALUES (?, ?, ?, ?)
    ");

    $user_id = 1; // static for now — can replace with session user later
    while (($row = fgetcsv($handle)) !== false) {
        // Expecting CSV columns: date, steps, resting_hr, hrv
        [$date, $steps, $resting_hr, $hrv] = $row;

        $ts = date('Y-m-d 00:00:00', strtotime($date));

        if (is_numeric($steps)) {
            $insert->execute([$user_id, $ts, 'steps', $steps]);
            $count++;
        }
        if (is_numeric($resting_hr)) {
            $insert->execute([$user_id, $ts, 'resting_hr', $resting_hr]);
            $count++;
        }
        if (is_numeric($hrv)) {
            $insert->execute([$user_id, $ts, 'hrv', $hrv]);
            $count++;
        }
    }

    fclose($handle);
    echo json_encode(["status" => "ok", "rows_imported" => $count]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "error" => $e->getMessage()]);
}
?>
