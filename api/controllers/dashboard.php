<?php
require_once __DIR__ . '/../config.php';

function fetch_score_for_day(PDO $pdo, int $userId, string $day): ?float {
  $stmt = $pdo->prepare("CALL sp_get_daily_score(:uid, :pday, @p_score)");
  $stmt->execute([':uid' => $userId, ':pday' => $day]);
  $stmt->closeCursor();
  $select = $pdo->query("SELECT @p_score AS score");
  $scoreRow = $select ? $select->fetch(PDO::FETCH_ASSOC) : null;
  if ($select) {
    $select->closeCursor();
  }
  if (!$scoreRow || $scoreRow['score'] === null) {
    return null;
  }
  return (float)$scoreRow['score'];
}

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
  // score trend (last 7 days) via stored procedure
  $scoreRows = [];
  $scoreTodayValue = null;
  $cursor = new DateTimeImmutable($rangeStart);
  while ($cursor <= $today) {
    $dayStr = $cursor->format('Y-m-d');
    $scoreVal = fetch_score_for_day($pdo, $userId, $dayStr);
    if ($dayStr === $todayStr) {
      $scoreTodayValue = $scoreVal;
    }
    $scoreRows[] = ['day' => $dayStr, 'score' => $scoreVal];
    $cursor = $cursor->add(new DateInterval('P1D'));
  }
  $latestScoreValue = null;
  $latestScoreDay = null;
  for ($idx = count($scoreRows) - 1; $idx >= 0; $idx--) {
    $row = $scoreRows[$idx];
    if ($row['score'] !== null) {
      $latestScoreValue = $row['score'];
      $latestScoreDay = $row['day'];
      break;
    }
  }

  // readiness components (wearables, sleep, workout) aggregated manually so we can show workouts even without wearables logged that day
  $wearStmt = $pdo->prepare("
    SELECT DATE(ts) AS day,
           AVG(CASE WHEN metric='hrv' THEN value END) AS avg_hrv,
           AVG(CASE WHEN metric='resting_hr' THEN value END) AS avg_rhr,
           SUM(CASE WHEN metric='steps' THEN value END) AS steps
    FROM wearable_readings
    WHERE user_id = ? AND DATE(ts) BETWEEN ? AND ?
    GROUP BY day
  ");
  $wearStmt->execute([$userId, $rangeStart, $todayStr]);
  $wearRows = $wearStmt->fetchAll() ?: [];

  $sleepStmt = $pdo->prepare("
    SELECT DATE(start_time) AS day,
           SUM(TIMESTAMPDIFF(SECOND,start_time,end_time))/3600 AS sleep_hours
    FROM sleep_sessions
    WHERE user_id = ? AND DATE(start_time) BETWEEN ? AND ?
    GROUP BY day
  ");
  $sleepStmt->execute([$userId, $rangeStart, $todayStr]);
  $sleepRows = $sleepStmt->fetchAll() ?: [];

  $wkStmt = $pdo->prepare("
    SELECT DATE(started_at) AS day,
           SUM(duration_min) AS workout_min
    FROM workouts
    WHERE user_id = ? AND DATE(started_at) BETWEEN ? AND ?
    GROUP BY day
  ");
  $wkStmt->execute([$userId, $rangeStart, $todayStr]);
  $wkRows = $wkStmt->fetchAll() ?: [];

  $readinessMap = [];
  $ensureDay = function($day) use (&$readinessMap) {
    if (!isset($readinessMap[$day])) {
      $readinessMap[$day] = [
        'avg_hrv' => null,
        'avg_rhr' => null,
        'steps' => 0,
        'sleep_hours' => 0,
        'workout_min' => 0,
      ];
    }
  };

  foreach ($wearRows as $row) {
    $day = $row['day'];
    $ensureDay($day);
    if ($row['avg_hrv'] !== null) {
      $readinessMap[$day]['avg_hrv'] = (float)$row['avg_hrv'];
    }
    if ($row['avg_rhr'] !== null) {
      $readinessMap[$day]['avg_rhr'] = (float)$row['avg_rhr'];
    }
    $readinessMap[$day]['steps'] = (float)($row['steps'] ?? 0);
  }

  foreach ($sleepRows as $row) {
    $day = $row['day'];
    $ensureDay($day);
    $readinessMap[$day]['sleep_hours'] = (float)($row['sleep_hours'] ?? 0);
  }

  foreach ($wkRows as $row) {
    $day = $row['day'];
    $ensureDay($day);
    $readinessMap[$day]['workout_min'] = (float)($row['workout_min'] ?? 0);
  }

  ksort($readinessMap);
  $latestReady = null;
  $sleepDisplayHours = 0;
  if ($readinessMap) {
    $dayKeys = array_keys($readinessMap);
    $lastDay = end($dayKeys);
    $latestReady = $readinessMap[$lastDay];
    $yesterday = $today->sub(new DateInterval('P1D'))->format('Y-m-d');
    if (isset($readinessMap[$yesterday])) {
      $sleepDisplayHours = $readinessMap[$yesterday]['sleep_hours'];
    } else {
      $sleepDisplayHours = $latestReady['sleep_hours'] ?? 0;
    }
  }

  // compute 7-day averages for the readiness metrics
  $dayWindowCount = 0;
  $stepTotal = 0;
  $sleepTotal = 0;
  $workoutTotal = 0;
  $hrvTotal = 0;
  $hrvDays = 0;
  $rhrTotal = 0;
  $rhrDays = 0;
  $cursor = new DateTimeImmutable($rangeStart);
  while ($cursor <= $today) {
    $dayStr = $cursor->format('Y-m-d');
    $row = $readinessMap[$dayStr] ?? [];
    if (array_key_exists('avg_hrv', $row) && $row['avg_hrv'] !== null) {
      $hrvTotal += (float)$row['avg_hrv'];
      $hrvDays++;
    }
    if (array_key_exists('avg_rhr', $row) && $row['avg_rhr'] !== null) {
      $rhrTotal += (float)$row['avg_rhr'];
      $rhrDays++;
    }
    $stepTotal += (float)($row['steps'] ?? 0);
    $sleepTotal += (float)($row['sleep_hours'] ?? 0);
    $workoutTotal += (float)($row['workout_min'] ?? 0);
    $dayWindowCount++;
    $cursor = $cursor->add(new DateInterval('P1D'));
  }
  $dayWindowCount = max(1, $dayWindowCount);
  $readinessAverages = [
    'avg_hrv' => $hrvDays ? round($hrvTotal / $hrvDays) : null,
    'avg_rhr' => $rhrDays ? round($rhrTotal / $rhrDays) : null,
    'steps' => round($stepTotal / $dayWindowCount),
    'sleep_hours' => round($sleepTotal / $dayWindowCount, 1),
    'workout_min' => round($workoutTotal / $dayWindowCount),
  ];

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
  $currentSleep = $sleepDisplayHours;
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
      'today' => $scoreTodayValue,
      'latest' => $latestScoreValue,
      'latest_day' => $latestScoreDay,
      'trend' => $scoreRows,
    ],
    'readiness' => [
      'avg_hrv' => $readinessAverages['avg_hrv'],
      'avg_rhr' => $readinessAverages['avg_rhr'],
      'steps' => $readinessAverages['steps'],
      'sleep_hours' => $readinessAverages['sleep_hours'],
      'workout_min' => $readinessAverages['workout_min'],
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
