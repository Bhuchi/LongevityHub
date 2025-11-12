<?php
require_once __DIR__ . '/../config.php';

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

if (($_SESSION['user']['role'] ?? '') !== 'admin') {
  http_response_code(403);
  echo json_encode(['ok' => false, 'error' => 'forbidden']);
  exit;
}

function json_fail($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  $totals = [
    'users' => (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(),
    'foods' => (int)$pdo->query("SELECT COUNT(*) FROM foods")->fetchColumn(),
    'nutrients' => (int)$pdo->query("SELECT COUNT(*) FROM nutrients")->fetchColumn(),
    'meals' => (int)$pdo->query("SELECT COUNT(*) FROM meals")->fetchColumn(),
  ];

  $end = new DateTimeImmutable('today');
  $start = $end->sub(new DateInterval('P6D'));
  $startDate = $start->format('Y-m-d');
  $endDate = $end->format('Y-m-d');

  $weekly = [];
  $cursor = $start;
  for ($i = 0; $i < 7; $i++) {
    $weekly[$cursor->format('Y-m-d')] = [
      'day' => $cursor->format('D'),
      'date' => $cursor->format('Y-m-d'),
      'new_users' => 0,
      'meals' => 0,
    ];
    $cursor = $cursor->add(new DateInterval('P1D'));
  }

  $userStmt = $pdo->prepare("
    SELECT DATE(created_at) AS day, COUNT(*) AS cnt
    FROM users
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY day
  ");
  $userStmt->execute([$startDate, $endDate]);
  foreach ($userStmt as $row) {
    $day = $row['day'];
    if (isset($weekly[$day])) {
      $weekly[$day]['new_users'] = (int)$row['cnt'];
    }
  }

  $mealStmt = $pdo->prepare("
    SELECT DATE(eaten_at) AS day, COUNT(*) AS cnt
    FROM meals
    WHERE DATE(eaten_at) BETWEEN ? AND ?
    GROUP BY day
  ");
  $mealStmt->execute([$startDate, $endDate]);
  foreach ($mealStmt as $row) {
    $day = $row['day'];
    if (isset($weekly[$day])) {
      $weekly[$day]['meals'] = (int)$row['cnt'];
    }
  }

  $nutrientStmt = $pdo->query("
    SELECT n.name, n.unit, SUM(fn.amount_per_100g) AS total_amount
    FROM nutrients n
    LEFT JOIN food_nutrients fn ON fn.nutrient_id = n.nutrient_id
    GROUP BY n.nutrient_id
    ORDER BY (total_amount IS NULL), total_amount DESC, n.name ASC
    LIMIT 12
  ");
  $nutrients = [];
  foreach ($nutrientStmt as $row) {
    $nutrients[] = [
      'name' => $row['name'],
      'unit' => $row['unit'],
      'value' => isset($row['total_amount']) ? (float)$row['total_amount'] : 0,
    ];
  }

  echo json_encode([
    'ok' => true,
    'stats' => $totals,
    'weekly' => array_values($weekly),
    'nutrients' => $nutrients,
    'range' => ['start' => $startDate, 'end' => $endDate],
  ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  json_fail($e->getMessage(), 500);
}
