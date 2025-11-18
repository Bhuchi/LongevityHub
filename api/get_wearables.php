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
    $limit = isset($_GET['limit']) ? max(1, min(200, (int)$_GET['limit'])) : 30;
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $offset = ($page - 1) * $limit;

    $dateFilter = null;
    if (!empty($_GET['date'])) {
        $d = DateTime::createFromFormat('Y-m-d', $_GET['date']);
        if ($d) $dateFilter = $d->format('Y-m-d');
    }

    $rangeParam = strtolower((string)($_GET['range'] ?? '7d'));
    $today = new DateTimeImmutable('today');
    $start = $today;
    $useRangeFilter = true;
    switch ($rangeParam) {
        case '30d':
            $start = $today->sub(new DateInterval('P29D'));
            break;
        case '1m':
            $start = $today->sub(new DateInterval('P1M'));
            break;
        case '1y':
            $start = $today->sub(new DateInterval('P1Y'));
            break;
        case 'all':
            $useRangeFilter = false;
            break;
        case '7d':
        default:
            $start = $today->sub(new DateInterval('P6D'));
            $rangeParam = '7d';
            break;
    }

    $where = "user_id = :uid";
    $params = ['uid' => $user_id];
    if ($useRangeFilter) {
        $startBound = $start->format('Y-m-d');
        $where .= " AND DATE(ts) >= :start_date";
        $params['start_date'] = $startBound;
    }
    if ($dateFilter) {
        $where .= " AND DATE(ts) = :day";
        $params['day'] = $dateFilter;
    }

    $sql = "SELECT 
                DATE(ts) AS date,
                SUM(CASE WHEN metric = 'steps' THEN value ELSE 0 END) AS steps,
                ROUND(AVG(CASE WHEN metric = 'resting_hr' THEN value END)) AS heart_rate,
                ROUND(SUM(CASE WHEN metric = 'steps' THEN value * 0.45 ELSE 0 END)) AS calories
            FROM wearable_readings
            WHERE {$where}
            GROUP BY DATE(ts)
            ORDER BY date DESC
            LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue(':' . $key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $countSql = "SELECT COUNT(DISTINCT DATE(ts)) AS total_days
                 FROM wearable_readings
                 WHERE {$where}";
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $val) {
        $countStmt->bindValue(':' . $key, $val);
    }
    $countStmt->execute();
    $totalDays = (int)$countStmt->fetchColumn();

    $hasMore = $offset + count($data) < $totalDays;

    echo json_encode([
        'rows' => $data,
        'page' => $page,
        'limit' => $limit,
        'total_days' => $totalDays,
        'has_more' => $hasMore,
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
