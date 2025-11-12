<?php
require_once __DIR__ . '/../config.php';

function json_fail($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

if (!isset($_SESSION['user']) || empty($_SESSION['user']['user_id'])) {
  json_fail('unauthorized', 401);
}

$user = $_SESSION['user'];
$userId = (int)$user['user_id'];

$today = new DateTimeImmutable('today');
$todayStr = $today->format('Y-m-d');
$rangeStart = $today->sub(new DateInterval('P6D'))->format('Y-m-d');

try {
  // score trend (last 7 days)
  $scoreStmt = $pdo->prepare("
    SELECT day, score
    FROM v_daily_score
    WHERE user_id = ?
      AND day BETWEEN ? AND ?
    ORDER BY day ASC
  ");
  $scoreStmt->execute([$userId, $rangeStart, $todayStr]);
  $scoreRows = $scoreStmt->fetchAll() ?: [];

  // readiness (hrv, rhr, steps, sleep, workout)
  $readyStmt = $pdo->prepare("
    SELECT day, steps, sleep_hours, workout_min, avg_hrv, avg_rhr
    FROM v_daily_readiness
    WHERE user_id = ?
      AND day BETWEEN ? AND ?
    ORDER BY day ASC
  ");
  $readyStmt->execute([$userId, $rangeStart, $todayStr]);
  $readyRows = $readyStmt->fetchAll() ?: [];
  $latestReady = $readyRows ? $readyRows[count($readyRows) - 1] : null;

  // nutrients (protein/carbs) for today + trend
  $nutrientStmt = $pdo->prepare("
    SELECT dn.day, n.name, dn.amount
    FROM v_daily_nutrients dn
    JOIN nutrients n ON n.nutrient_id = dn.nutrient_id
    WHERE dn.user_id = ?
      AND n.name IN ('protein_g','carb_g')
      AND dn.day BETWEEN ? AND ?
    ORDER BY dn.day ASC
  ");
  $nutrientStmt->execute([$userId, $rangeStart, $todayStr]);
  $nutrientRows = $nutrientStmt->fetchAll() ?: [];

  $proteinTrend = [];
  $nutrientsToday = ['protein_g' => 0, 'carb_g' => 0];
  foreach ($nutrientRows as $row) {
    if ($row['name'] === 'protein_g') {
      $proteinTrend[] = [
        'day' => $row['day'],
        'amount' => (float)$row['amount'],
      ];
    }
    if ($row['day'] === $todayStr) {
      $nutrientsToday[$row['name']] = (float)$row['amount'];
    }
  }

  // goals
  $goalStmt = $pdo->prepare("
    SELECT goal_type, target_value
    FROM user_goals
    WHERE user_id = ?
      AND is_active = 1
  ");
  $goalStmt->execute([$userId]);
  $goalRows = $goalStmt->fetchAll() ?: [];
  $goals = [];
  foreach ($goalRows as $row) {
    $goals[$row['goal_type']] = (float)$row['target_value'];
  }

  $currentSteps = $latestReady['steps'] ?? 0;
  $currentSleep = $latestReady['sleep_hours'] ?? 0;
  $currentWorkout = $latestReady['workout_min'] ?? 0;
  $currentProtein = $nutrientsToday['protein_g'] ?? 0;
  $currentCarb = $nutrientsToday['carb_g'] ?? 0;

  $goalPayload = [
    'steps' => [
      'current' => (float)$currentSteps,
      'goal' => $goals['steps'] ?? null,
    ],
    'sleep_hours' => [
      'current' => (float)$currentSleep,
      'goal' => $goals['sleep_hours'] ?? null,
    ],
    'workout_min' => [
      'current' => (float)$currentWorkout,
      'goal' => $goals['workout_min'] ?? null,
    ],
    'protein_g' => [
      'current' => (float)$currentProtein,
      'goal' => $goals['protein_g'] ?? null,
    ],
    'carb_g' => [
      'current' => (float)$currentCarb,
      'goal' => $goals['carb_g'] ?? null,
    ],
  ];

  // recent activity (meals, workouts, sleep)
  $events = [];

  $mealStmt = $pdo->prepare("
    SELECT eaten_at AS ts, note
    FROM meals
    WHERE user_id = ?
    ORDER BY eaten_at DESC
    LIMIT 5
  ");
  $mealStmt->execute([$userId]);
  foreach ($mealStmt as $row) {
    $events[] = [
      'type' => 'meal',
      'ts' => $row['ts'],
      'label' => 'Meal',
      'detail' => $row['note'] ?: 'Logged meal',
    ];
  }

  $workoutStmt = $pdo->prepare("
    SELECT started_at AS ts, duration_min, intensity, note
    FROM workouts
    WHERE user_id = ?
    ORDER BY started_at DESC
    LIMIT 5
  ");
  $workoutStmt->execute([$userId]);
  foreach ($workoutStmt as $row) {
    $events[] = [
      'type' => 'workout',
      'ts' => $row['ts'],
      'label' => 'Workout',
      'detail' => trim(($row['duration_min'] ?? 0) . " min " . ($row['intensity'] ?? '')),
    ];
  }

  $sleepStmt = $pdo->prepare("
    SELECT start_time AS ts, end_time
    FROM sleep_sessions
    WHERE user_id = ?
    ORDER BY start_time DESC
    LIMIT 5
  ");
  $sleepStmt->execute([$userId]);
  foreach ($sleepStmt as $row) {
    $start = strtotime($row['ts']);
    $end = strtotime($row['end_time']);
    $hrs = ($end > $start) ? round(($end - $start) / 3600, 1) : 0;
    $events[] = [
      'type' => 'sleep',
      'ts' => $row['ts'],
      'label' => 'Sleep',
      'detail' => "{$hrs} ชม.",
    ];
  }

  usort($events, function ($a, $b) {
    return strcmp($b['ts'], $a['ts']);
  });
  $events = array_slice($events, 0, 6);

  echo json_encode([
    'ok' => true,
    'score' => [
      'today' => $scoreRows ? (float)($scoreRows[count($scoreRows) - 1]['score'] ?? 0) : null,
      'trend' => $scoreRows,
    ],
    'readiness' => [
      'avg_hrv' => $latestReady['avg_hrv'] ?? null,
      'avg_rhr' => $latestReady['avg_rhr'] ?? null,
      'steps' => $latestReady['steps'] ?? 0,
      'sleep_hours' => $latestReady['sleep_hours'] ?? 0,
      'workout_min' => $latestReady['workout_min'] ?? 0,
    ],
    'goals' => $goalPayload,
    'protein' => [
      'today' => $currentProtein,
      'trend' => $proteinTrend,
    ],
    'carb' => [
      'today' => $currentCarb,
    ],
    'recent_activity' => $events,
  ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  json_fail($e->getMessage(), 500);
}
