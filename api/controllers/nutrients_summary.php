<?php
require_once __DIR__ . '/../config.php';

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

$userId = (int)$_SESSION['user']['user_id'];

$rangeParam = strtolower((string)($_GET['range'] ?? '7d'));
$today = new DateTimeImmutable('today');
$start = $today;
switch ($rangeParam) {
  case '30d':
    $start = $today->sub(new DateInterval('P29D'));
    break;
  case '1y':
    $start = $today->sub(new DateInterval('P1Y'));
    break;
  case 'all':
    $start = (new DateTimeImmutable('2000-01-01'));
    break;
  case '7d':
  default:
    $start = $today->sub(new DateInterval('P6D'));
    $rangeParam = '7d';
    break;
}

$startDate = $start->format('Y-m-d');
$endDate = $today->format('Y-m-d');

try {
  $stmt = $pdo->prepare("SELECT dn.day,
                                SUM(CASE WHEN n.name = 'protein_g' THEN dn.amount ELSE 0 END) AS protein_g,
                                SUM(CASE WHEN n.name IN ('carb_g','Carbs_g') THEN dn.amount ELSE 0 END) AS carb_g
                          FROM v_daily_nutrients dn
                          JOIN nutrients n ON n.nutrient_id = dn.nutrient_id
                          WHERE dn.user_id = ? AND dn.day BETWEEN ? AND ?
                          GROUP BY dn.day
                          ORDER BY dn.day DESC");
  $stmt->execute([$userId, $startDate, $endDate]);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(['ok' => true, 'rows' => $rows], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
