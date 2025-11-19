<?php
require_once __DIR__ . '/../config.php';

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

$userId = (int)$_SESSION['user']['user_id'];

$rangeParam = strtolower((string)($_GET['range'] ?? '30d'));
$today = new DateTimeImmutable('today');
$start = $today;
switch ($rangeParam) {
  case '7d':
    $start = $today->sub(new DateInterval('P6D'));
    break;
  case '1y':
    $start = $today->sub(new DateInterval('P1Y'));
    break;
  case 'all':
    $start = (new DateTimeImmutable('2000-01-01'));
    break;
  case '30d':
  default:
    $start = $today->sub(new DateInterval('P29D'));
    $rangeParam = '30d';
    break;
}

$startDate = $start->format('Y-m-d');
$endDate = $today->format('Y-m-d');

try {
  $stmt = $pdo->prepare("SELECT day, goal_type, target_value, actual_value
                          FROM v_goal_progress_daily
                          WHERE user_id = ? AND day BETWEEN ? AND ?
                          ORDER BY day DESC, goal_type ASC");
  $stmt->execute([$userId, $startDate, $endDate]);
  $rows = [];
  foreach ($stmt as $row) {
    $rows[] = [
      'day' => $row['day'],
      'goal_type' => $row['goal_type'],
      'target_value' => (float)$row['target_value'],
      'actual_value' => $row['actual_value'] !== null ? (float)$row['actual_value'] : null,
    ];
  }
  echo json_encode(['ok' => true, 'rows' => $rows], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
