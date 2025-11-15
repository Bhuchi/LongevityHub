<?php
// Allow Vite dev / preview origins
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
  header("Access-Control-Allow-Origin: $origin");
  header('Access-Control-Allow-Credentials: true');
  header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config.php';

function fetch_score_for_day(PDO $pdo, int $userId, string $day): ?float {
  $stmt = $pdo->prepare("CALL sp_get_daily_score(:uid, :pday, @p_score)");
  $stmt->execute([':uid' => $userId, ':pday' => $day]);
  $stmt->closeCursor();
  $select = $pdo->query("SELECT @p_score AS score");
  $row = $select ? $select->fetch(PDO::FETCH_ASSOC) : null;
  if ($select) {
    $select->closeCursor();
  }
  if (!$row || $row['score'] === null) {
    return null;
  }
  return (float)$row['score'];
}

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}
$user = $_SESSION['user'];
$userId = (int)$user['user_id'];

function json_fail($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

$daysParam = isset($_GET['days']) ? (int)$_GET['days'] : 14;
$days = max(1, min(90, $daysParam));

$end = new DateTimeImmutable('today');
$start = $end->sub(new DateInterval('P' . max(0, $days - 1) . 'D'));
$startDate = $start->format('Y-m-d');
$endDate = $end->format('Y-m-d');

try {
  $readinessStmt = $pdo->prepare("
    SELECT day, steps, sleep_hours, workout_min
    FROM v_daily_readiness
    WHERE user_id = ? AND day BETWEEN ? AND ?
    ORDER BY day ASC
  ");
  $readinessStmt->execute([$userId, $startDate, $endDate]);
  $readinessRows = $readinessStmt->fetchAll();

  $nutrientStmt = $pdo->prepare("
    SELECT dn.day, n.name AS nutrient, dn.amount
    FROM v_daily_nutrients dn
    JOIN nutrients n ON n.nutrient_id = dn.nutrient_id
    WHERE dn.user_id = ? AND dn.day BETWEEN ? AND ? AND n.name IN ('protein_g','carb_g')
  ");
  $nutrientStmt->execute([$userId, $startDate, $endDate]);
  $nutrientRows = $nutrientStmt->fetchAll();

} catch (Throwable $e) {
  json_fail($e->getMessage(), 500);
}

$window = [];
$cursor = $start;
for ($i = 0; $i < $days; $i++) {
  $dayStr = $cursor->format('Y-m-d');
  $window[$dayStr] = [
    'day' => $dayStr,
    'steps' => 0,
    'sleep_hours' => 0,
    'workout_min' => 0,
    'protein_g' => 0,
    'carb_g' => 0,
    'score' => null,
  ];
  $cursor = $cursor->add(new DateInterval('P1D'));
}

foreach ($readinessRows as $row) {
  $day = $row['day'];
  if (!isset($window[$day])) continue;
  $window[$day]['steps'] = (int)round($row['steps'] ?? 0);
  $window[$day]['sleep_hours'] = (float)($row['sleep_hours'] ?? 0);
  $window[$day]['workout_min'] = (int)round($row['workout_min'] ?? 0);
}

foreach ($nutrientRows as $row) {
  $day = $row['day'];
  if (!isset($window[$day])) continue;
  $amount = (float)$row['amount'];
  if ($row['nutrient'] === 'protein_g') {
    $window[$day]['protein_g'] = $amount;
  } elseif ($row['nutrient'] === 'carb_g') {
    $window[$day]['carb_g'] = $amount;
  }
}

foreach (array_keys($window) as $day) {
  $window[$day]['score'] = fetch_score_for_day($pdo, $userId, $day);
}

echo json_encode([
  'ok' => true,
  'range_days' => $days,
  'rows' => array_values($window),
], JSON_UNESCAPED_UNICODE);
