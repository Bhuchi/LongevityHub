<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "config.php";

$user_id = 1; // ✅ matches your phpMyAdmin data

try {
    // ✅ The SQL now matches your table's structure perfectly
    $sql = "SELECT 
                DATE(ts) AS date,
                SUM(CASE WHEN metric = 'steps' THEN value ELSE 0 END) AS steps,
                ROUND(AVG(CASE WHEN metric = 'resting_hr' THEN value ELSE NULL END)) AS heart_rate,
                ROUND(SUM(CASE WHEN metric = 'steps' THEN value * 0.45 ELSE 0 END)) AS calories
            FROM wearable_readings
            WHERE user_id = :uid
            GROUP BY DATE(ts)
            ORDER BY date DESC
            LIMIT 10";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['uid' => $user_id]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($data, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
