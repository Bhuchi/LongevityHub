<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "config.php";

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "unauthorized"]);
    exit;
}
$user_id = (int)$_SESSION['user']['user_id'];

try {
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
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
